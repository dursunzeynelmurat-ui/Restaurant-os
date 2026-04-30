import { z } from "zod";

export const CreateOrderSchema = z.object({
  tableId: z.string().min(1),
  covers: z.number().int().min(1).default(1),
  kitchenNote: z.string().max(300).optional(),
});

export const AddOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        note: z.string().max(200).optional(),
        course: z.number().int().min(1).max(9).default(1),
        modifiers: z
          .array(
            z.object({
              modifierId: z.string().min(1),
              priceDelta: z.number(),
            })
          )
          .default([]),
      })
    )
    .min(1)
    .max(100),
});

export const CreatePaymentSchema = z.object({
  orderId: z.string().min(1),
  tip: z.number().min(0).default(0),
  method: z.enum(["CASH", "CARD", "TRANSFER", "MIXED"]),
  splits: z
    .array(
      z.object({
        method: z.enum(["CASH", "CARD", "TRANSFER"]),
        amount: z.number().positive(),
      })
    )
    .optional(),
});

export const VoidItemSchema = z.object({
  reason: z.string().min(3).max(300),
});
