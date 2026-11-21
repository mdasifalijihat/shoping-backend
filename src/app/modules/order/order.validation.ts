import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../../../generated/prisma/enums.js";
import { paginationSchema } from "../../utils/pagination.js";
import { cartItemSchema } from "../cart/cart.validation.js";

const text = z.string().trim().min(1);
const phone = text.max(40);
const status = {
  orderStatus: z.enum(OrderStatus).exactOptional(),
  paymentStatus: z.enum(PaymentStatus).exactOptional(),
};
export const createSchema = z.object({
  body: z.strictObject({
    customerName: text,
    customerPhone: phone,
    customerEmail: z.string().trim().pipe(z.email()).nullable().exactOptional(),
    shippingAddress: text,
    orderNote: z.string().trim().nullable().exactOptional(),
    items: z.array(cartItemSchema).min(1).max(100),
    paymentMethodId: text,
    paymentData: z.record(z.string(), z.json()).default({}),
    shippingZoneId: text,
    couponCode: text.toUpperCase().exactOptional(),
  }),
});
export const byIdSchema = z.object({ params: z.object({ id: text }) });
export const historySchema = z.object({ query: paginationSchema });
export const adminListSchema = z.object({
  query: paginationSchema.extend({
    ...status,
    paymentMethodId: text.exactOptional(),
    searchTerm: z.string().trim().exactOptional(),
  }),
});
export const trackSchema = z.object({
  params: z.object({ orderNumber: text.toUpperCase() }),
  query: z.object({ customerPhone: phone }),
});
export const updateStatusSchema = byIdSchema.extend({
  body: z
    .strictObject(status)
    .refine(
      (body) => Object.keys(body).length > 0,
      "Provide an order or payment status"
    ),
});

export type CreateOrder = z.output<typeof createSchema>["body"];
export type AdminOrderQuery = z.output<typeof adminListSchema>["query"];
export type OrderStatusUpdate = z.output<typeof updateStatusSchema>["body"];
