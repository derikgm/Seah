import { getRateByCode } from "./queries/exchangeRates";
import { insertTransaction } from "./queries/transactions";
import { listRecurringRules, markRuleGenerated } from "./queries/recurringRules";
import { convertToCup, rateForMethod } from "./exchange";
import type { RecurringRule } from "../types";

// ISO-8601 week number, used as the dedup key for weekly rules.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// A rule is due when its scheduled day has arrived in the current period and it
// hasn't generated for that period yet. The day is clamped to the month's length
// so a "day 31" rule still fires on Feb 28th.
function scheduleFor(rule: RecurringRule, now: Date): { due: boolean; periodKey: string; day: number } {
  if (rule.frequency === "weekly") {
    const periodKey = isoWeekKey(now);
    return { due: rule.last_generated_month !== periodKey, periodKey, day: now.getDate() };
  }

  const periodKey = monthKey(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const scheduledDay = Math.min(rule.day_of_month, daysInMonth);
  const dayPassed = now.getDate() >= scheduledDay;
  return { due: dayPassed && rule.last_generated_month !== periodKey, periodKey, day: scheduledDay };
}

// Generate transactions for every active, due recurring rule. Returns the number
// of transactions created. Safe to run on every app start.
export async function generateRecurring(): Promise<number> {
  const now = new Date();
  const rules = await listRecurringRules(true);
  let created = 0;

  for (const rule of rules) {
    if (!rule.is_active) continue;
    const { due, periodKey, day } = scheduleFor(rule, now);
    if (!due) continue;

    // Resolve the CUP rate at generation time; a missing rate means the rule's
    // currency is the base (CUP) or has no configured rate yet — fall back to the
    // raw amount as CUP.
    let amountCup = rule.amount;
    let rateUsed: number | null = null;
    const rate = await getRateByCode(rule.currency);
    if (rate) {
      rateUsed = rateForMethod(rate, rule.payment_method);
      amountCup = convertToCup(rule.amount, rateUsed);
    }

    // Backdate the transaction to the scheduled day within the current month.
    const date = new Date(now.getFullYear(), now.getMonth(), day);

    await insertTransaction({
      type: rule.type,
      amount: rule.amount,
      currency: rule.currency,
      amount_cup: amountCup,
      category_id: rule.category_id,
      description: rule.description,
      payment_method: rule.payment_method,
      exchange_rate_used: rateUsed,
      date: date.toISOString(),
      is_recurring_generated: true,
    });
    await markRuleGenerated(rule.id, periodKey);
    created++;
  }
  return created;
}
