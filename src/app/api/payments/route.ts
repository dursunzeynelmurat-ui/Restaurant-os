import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { requireSession, ok, fail } from "@/lib/api-helpers";
import { CreatePaymentSchema } from "@/lib/validators/order";

export async function POST(req: NextRequest) {
  // Only cashier, manager, owner can process payments
  const auth = await requireSession(["CASHIER", "MANAGER", "OWNER"]);
  if (!auth.ok) return auth.response;
  const { ctx } = auth;

  const body = await req.json();
  const parsed = CreatePaymentSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.flatten().toString());

  const { orderId, tip, method, splits } = parsed.data;
  const db = createServerClient();

  const { data: order, error: orderErr } = await db
    .from("orders")
    .select(`
      id, status, table_id,
      items:order_items(
        unit_price, quantity,
        modifiers:order_item_modifiers(price_delta)
      )
    `)
    .eq("id", orderId)
    .eq("branch_id", ctx.branchId)
    .single();

  if (orderErr || !order) return fail("Order not found", 404);
  if (order.status === "CLOSED") return fail("Order already closed", 409);
  if (order.status === "VOIDED") return fail("Order is voided", 409);

  // *** Server-side total recalculation — never trust client amount ***
  const serverSubtotal = (order.items ?? []).reduce(
    (sum: number, item: { unit_price: number; quantity: number; modifiers: { price_delta: number }[] }) => {
      const modTotal = (item.modifiers ?? []).reduce(
        (ms, m) => ms + Number(m.price_delta), 0
      );
      return sum + (Number(item.unit_price) + modTotal) * item.quantity;
    },
    0
  );

  const serverTotal = serverSubtotal + Number(tip ?? 0);

  // Validate split amounts match total for MIXED payments
  if (method === "MIXED") {
    if (!splits?.length) return fail("MIXED payment requires split breakdown");
    const splitTotal = splits.reduce((s, sp) => s + sp.amount, 0);
    const diff = Math.abs(splitTotal - serverTotal);
    if (diff > 0.01) {
      return fail(
        `Split total (${splitTotal.toFixed(2)}) does not match order total (${serverTotal.toFixed(2)})`
      );
    }
  }

  const now = new Date().toISOString();

  // Create payment with server-calculated amount
  const { data: payment, error: payErr } = await db
    .from("payments")
    .insert({
      order_id: orderId,
      branch_id: ctx.branchId,
      amount: serverSubtotal,
      tip: Number(tip ?? 0),
      method,
      status: "COMPLETED",
    })
    .select()
    .single();

  if (payErr) return fail(payErr.message, 500);

  // Insert payment splits for MIXED
  if (method === "MIXED" && splits?.length) {
    await db.from("payment_splits").insert(
      splits.map((s) => ({
        payment_id: payment.id,
        method: s.method,
        amount: s.amount,
      }))
    );
  }

  // Close order and update table status
  const [orderUpdate, tableUpdate] = await Promise.all([
    db
      .from("orders")
      .update({ status: "CLOSED", closed_at: now, updated_at: now })
      .eq("id", orderId),
    db
      .from("tables")
      .update({ status: "NEEDS_CLEANING", updated_at: now })
      .eq("id", order.table_id),
  ]);

  if (orderUpdate.error) {
    // Payment created but order not closed — log and return payment anyway
    console.error("Order close failed after payment:", orderUpdate.error);
  }
  if (tableUpdate.error) {
    console.error("Table update failed after payment:", tableUpdate.error);
  }

  // Audit log
  await db.from("audit_logs").insert({
    user_id: ctx.userId,
    business_id: ctx.businessId,
    branch_id: ctx.branchId,
    action: "PAYMENT_ACCEPTED",
    entity: "payment",
    entity_id: payment.id,
    payload: { amount: serverSubtotal, tip, method, orderId, serverTotal },
  });

  return ok({ payment, total: serverTotal }, 201);
}
