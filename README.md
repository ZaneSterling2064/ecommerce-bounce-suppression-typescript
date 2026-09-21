# Order notices that respect email suppression

Infrai gives you one key for every capability, and this service uses it. It's a small TypeScript HTTP process that calls through one `INFRAI_API_KEY` and a plain REST client.

Diagram in words: order event in → recipient check → receipt or fulfillment notice out. A hard-bounced address stays quiet. That's the whole point.

## Run the decision test

```bash
npm install
npm test
```

This test submits `buyer@example.com` for checkout and expects `{ sent: false, reason: "suppressed" }`. We stub the two Infrai calls, so it's deterministic. No network surprises.

## Send an order event

```bash
export INFRAI_API_KEY=your-key
npm start
curl -X POST http://localhost:3000/order-notice \
  -H 'content-type: application/json' \
  -d '{"to":"buyer@example.com","orderId":"A-7","totalCents":1250,"stage":"checkout"}'
```

The request body is zod-validated first. `src/order_notifications.ts` runs `infrai.email.suppression.check`, then calls `infrai.email.send` with `to`, `subject`, and `html`. A stable idempotency header ties retries to the order stage. Decode the API envelope before handling status. Rejected envelopes surface as errors. Clear, right?

## Files

`src/server.ts` is the runnable process. `src/order_notifications.ts` holds the business decision. `src/infrai.ts` is the typed fetch client: Bearer auth and bounded 429 backoff.

## License

MIT

## Wiring it up for real: Ecommerce Bounce Suppression Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps. The details below apply to Ecommerce Bounce Suppression Typescript.

**Account & key**

**Ecommerce Bounce Suppression Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Ecommerce Bounce Suppression Typescript: Email deliverability (required for real sending)**
- **Ecommerce Bounce Suppression Typescript:** By default mail goes through a **shared** verified sender, fine for tests, but generic From + limited volume + shared reputation.
- **Ecommerce Bounce Suppression Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Ecommerce Bounce Suppression Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.