import { createHmac, timingSafeEqual } from "crypto";

const BASE_URL = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const json = await res.json().catch(() => null) as { status?: boolean; message?: string; data?: T } | null;

  if (!res.ok || !json?.status) {
    throw new PaystackError(json?.message ?? `Paystack request failed (${res.status})`, res.status);
  }

  return json.data as T;
}

export function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
    }),
  });
}

export function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  reference: string;
}> {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function listBanks(): Promise<{ name: string; code: string; slug: string }[]> {
  return paystackFetch("/bank?country=nigeria&currency=NGN");
}

export function resolveAccountNumber(
  accountNumber: string,
  bankCode: string,
): Promise<{ account_number: string; account_name: string }> {
  return paystackFetch(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
}

export function createTransferRecipient(params: {
  name: string;
  account_number: string;
  bank_code: string;
}): Promise<{ recipient_code: string }> {
  return paystackFetch("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      currency: "NGN",
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
    }),
  });
}

export function initiateTransfer(params: {
  amountKobo: number;
  recipientCode: string;
  reason: string;
  reference: string;
}): Promise<{ transfer_code: string; status: string }> {
  return paystackFetch("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: params.amountKobo,
      recipient: params.recipientCode,
      reason: params.reason,
      reference: params.reference,
    }),
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;

  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");

  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
