import { infrai } from "./infrai.js";

export type OrderNotice = { to: string; orderId: string; totalCents: number; stage: "checkout" | "fulfilled" };

export async function sendOrderNotice(input: OrderNotice): Promise<{ sent: boolean; reason?: string; message_id?: string }> {
  const suppression = await infrai.email.suppression.check(input.to);
  if (suppression.suppressed) return { sent: false, reason: "suppressed" };
  const subject = input.stage === "checkout" ? `Order ${input.orderId} received` : `Order ${input.orderId} shipped`;
  const html = `<p>Order <strong>${input.orderId}</strong> total: $${(input.totalCents / 100).toFixed(2)}.</p>`;
  const result = await infrai.email.send({ to: input.to, subject, html }, { "Idempotency-Key": `order-${input.orderId}-${input.stage}` });
  return { sent: true, message_id: result.message_id };
}
