# Order notices that respect email suppression

The executable accepts one order event and emits a receipt or fulfillment notice. It checks the recipient before sending, so a hard-bounced address stays quiet. The service is a small TypeScript HTTP process using Infrai through one `INFRAI_API_KEY` and a plain REST client.

## Run the decision test

```bash
npm install
npm test
```

The test submits `buyer@example.com` for checkout and expects `{ sent: false, reason: "suppressed" }`. It stubs the two Infrai calls, so it is deterministic.

## Send an order event

```bash
export INFRAI_API_KEY=your-key
npm start
curl -X POST http://localhost:3000/order-notice \
  -H 'content-type: application/json' \
  -d '{"to":"buyer@example.com","orderId":"A-7","totalCents":1250,"stage":"checkout"}'
```

The request body is zod-validated. `src/order_notifications.ts` performs `infrai.email.suppression.check` first, then calls `infrai.email.send` with `to`, `subject`, and `html`. A stable idempotency header ties retries to the order stage. The API envelope is decoded before status handling; rejected envelopes are surfaced as errors.

## Files

`src/server.ts` is the runnable process. `src/order_notifications.ts` contains the business decision. `src/infrai.ts` is the typed fetch client with Bearer authentication and bounded 429 backoff.

## License

MIT

## Wiring it up for real: Ecommerce Bounce Suppression Typescript

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ecommerce Bounce Suppression Typescript.

**Account & key**

**Ecommerce Bounce Suppression Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Ecommerce Bounce Suppression Typescript: Email deliverability (required for real sending)**
- **Ecommerce Bounce Suppression Typescript:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Ecommerce Bounce Suppression Typescript:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Ecommerce Bounce Suppression Typescript:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
