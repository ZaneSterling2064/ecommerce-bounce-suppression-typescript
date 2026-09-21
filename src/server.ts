import { createServer } from "node:http";
import { z } from "zod";
import { sendOrderNotice } from "./order_notifications.js";

const bodySchema = z.object({ to: z.string().email(), orderId: z.string().min(1), totalCents: z.number().int().nonnegative(), stage: z.enum(["checkout", "fulfilled"]) });

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/order-notice") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const parsed = bodySchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) { res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "invalid request" })); return; }
    const result = await sendOrderNotice(parsed.data);
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) { res.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: String(error) })); }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("order-notice listening on port 3000"));
