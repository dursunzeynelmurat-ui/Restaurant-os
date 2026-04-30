import { z } from "zod";

export const CreateOrderSchema = z.object({
  tableId: z.string().min(1),
  covers: z.number().int().min(1).default(1),
});

export const AddOrderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1),
        note: z.string().optional(),
        course: z.number().int().min(1).default(1),
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
    .min(1),
});

export const CreatePaymentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive(),
  tip: z.number().min(0).default(0),
  method: z.enum(["CASH", "CARD", "TRANSFER", "MIXED"]),
});
