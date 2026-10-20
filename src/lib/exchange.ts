import type { ExchangeRate, PaymentMethod } from "../types";

// Resolve the transfer rate: manual value wins, otherwise derive it from the
// cash rate using the surcharge percentage. Falls back to cash when unknown.
export function resolveTransferRate(rate: ExchangeRate): number {
  if (rate.rate_transfer != null) return rate.rate_transfer;
  if (rate.transfer_surcharge_percent != null) {
    return rate.rate_cash * (1 + rate.transfer_surcharge_percent / 100);
  }
  return rate.rate_cash;
}

// Pick the CUP rate that applies for a given payment method. `other` has no
// known surcharge, so we treat it like cash.
export function rateForMethod(rate: ExchangeRate, method: PaymentMethod): number {
  if (method === "transfer") return resolveTransferRate(rate);
  return rate.rate_cash;
}

// Convert an amount in a foreign currency to CUP using the given rate.
export function convertToCup(amount: number, rate: number): number {
  return round2(amount * rate);
}

// The app always stores CUP equivalents rounded to 2 decimals.
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
