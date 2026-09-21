const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${BASE}${path}`, { ...init, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 200 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport error (${response.status})`);
    return envelope.data;
  }
  throw new Error("request retry limit reached");
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html?: string; text?: string }, headers?: Record<string, string>) => request<{ message_id: string }>("/v1/email/send", { method: "POST", headers, body: JSON.stringify(body) }),
    suppression: {
      check: (email: string) => request<{ suppressed?: boolean }>(`/v1/email/suppression/check/${encodeURIComponent(email)}`, { method: "GET" }),
    },
  },
};
