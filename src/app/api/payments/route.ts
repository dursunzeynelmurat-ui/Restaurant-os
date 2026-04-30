import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { CreatePaymentSchema } from "@/lib/validators/order";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreatePaymentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = createServerClient();
  const { orderId, amount, tip, method } = parsed.data;
  const branchId = session.user.branchId;

  // Verify order
  const { data: order } = await db
    .from("orders")
    .select("id, status, table_id")
    .eq("id", orderId)
    .eq("branch_id", branchId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "CLOSED") return NextResponse.json({ error: "Already closed" }, { status: 409 });

  const now = new Date().toISOString();

  // Create payment
  const { data: payment, error } = await db
    .from("payments")
    .insert({
      order_id: orderId,
      branch_id: branchId,
      amount,
      tip,
      method,
      status: "COMPLETED",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Close order and table
  await Promise.all([
    db
      .from("orders")
      .update({ status: "CLOSED", closed_at: now, updated_at: now })
      .eq("id", orderId),
    db
      .from("tables")
      .update({ status: "NEEDS_CLEANING", updated_at: now })
      .eq("id", order.table_id),
  ]);

  // Audit log
  await db.from("audit_logs").insert({
    user_id: session.user.id,
    business_id: session.user.businessId,
    branch_id: branchId,
    action: "PAYMENT_ACCEPTED",
    entity: "payment",
    entity_id: payment.id,
    payload: { amount, tip, method, orderId },
  });

  return NextResponse.json({ data: payment }, { status: 201 });
}
