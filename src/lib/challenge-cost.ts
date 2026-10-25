/**
 * The expected cost of getting funded: with a given chance of passing each
 * phase, how many attempts it takes on average and what they cost.
 */

export interface ChallengeCostInput {
  fee: number;
  steps: 1 | 2;
  phase1PassPercent: number;
  /** Of those who reach phase 2. Ignored for one-step challenges. */
  phase2PassPercent: number;
  /** Discount on attempts after the first, e.g. a free or cheaper retry. */
  retryDiscountPercent: number;
  /** Whether the firm refunds the fee of the passing attempt with the first payout. */
  feeRefunded: boolean;
}

export interface ChallengeCostResult {
  /** Chance one attempt ends funded, 0 to 1. */
  fundedChance: number;
  expectedAttempts: number;
  expectedSpend: number;
  /** Expected spend less the refunded fee, once funded and paid out. */
  netAfterRefund: number;
  /** Chance of being funded within three attempts, 0 to 1. */
  chanceWithinThree: number;
}

export function fundedChance(input: ChallengeCostInput): number {
  const p1 = input.phase1PassPercent / 100;
  const p2 = input.steps === 2 ? input.phase2PassPercent / 100 : 1;
  return Math.min(1, Math.max(0, p1 * p2));
}

export function challengeCost(input: ChallengeCostInput): ChallengeCostResult {
  const p = fundedChance(input);
  const expectedAttempts = p > 0 ? 1 / p : Number.POSITIVE_INFINITY;
  const retryFee = input.fee * (1 - input.retryDiscountPercent / 100);
  const expectedSpend = input.fee + (expectedAttempts - 1) * retryFee;
  // The refund is the fee of the passing attempt: the first (full fee) with chance p,
  // otherwise a retry (discounted fee).
  const refund = input.feeRefunded ? p * input.fee + (1 - p) * retryFee : 0;
  return {
    fundedChance: p,
    expectedAttempts,
    expectedSpend,
    netAfterRefund: expectedSpend - refund,
    chanceWithinThree: 1 - (1 - p) ** 3,
  };
}
