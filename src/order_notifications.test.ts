import assert from "node:assert/strict";
import { sendOrderNotice } from "./order_notifications.js";

const originalFetch = globalThis.fetch;
let sent = false;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("suppression/check")) return new Response(JSON.stringify({ ok: true, data: { suppressed: true } }), { status: 200 });
  sent = init?.method === "POST";
  return new Response(JSON.stringify({ ok: true, data: { message_id: "m1" } }), { status: 200 });
};
process.env.INFRAI_API_KEY = "test-key";
const result = await sendOrderNotice({ to: "buyer@example.com", orderId: "A-7", totalCents: 1250, stage: "checkout" });
assert.deepEqual(result, { sent: false, reason: "suppressed" });
assert.equal(sent, false);
globalThis.fetch = originalFetch;
console.log("suppressed recipients do not receive order notices");
