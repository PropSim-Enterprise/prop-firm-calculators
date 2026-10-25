/**
 * Position size for a prop firm account: the lot size that risks a set share of
 * the balance, and how many losing trades in a row the daily and overall
 * limits allow at that risk.
 */

export interface PositionSizeInput {
  balance: number;
  riskPercent: number;
  stopLossPips: number;
  /** Value of one pip for 1.00 lot, in the account currency. */
  pipValuePerLot: number;
  /** Smallest lot step the broker allows (usually 0.01). */
  lotStep: number;
  dailyLossPercent: number;
  maxLossPercent: number;
}

export interface PositionSizeResult {
  riskAmount: number;
  /** Lot size rounded down to the lot step, so risk never exceeds the target. */
  lots: number;
  /** Risk at the rounded lot size. */
  actualRisk: number;
  lossesToDailyLimit: number;
  lossesToMaxLoss: number;
}

/** Rounds down to a step, avoiding floating-point drift (0.29999 → 0.29). */
export function floorToStep(value: number, step: number): number {
  if (step <= 0) return value;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  const steps = Math.floor(Number((value / step).toFixed(6)));
  return Number((steps * step).toFixed(decimals));
}

/** Whole losing trades of `risk` that fit inside `limit`. */
const lossesWithin = (limit: number, risk: number) => (risk > 0 ? Math.floor(limit / risk) : 0);

export function positionSize(input: PositionSizeInput): PositionSizeResult {
  const riskAmount = input.balance * (input.riskPercent / 100);
  const riskPerLot = input.stopLossPips * input.pipValuePerLot;
  const lots = riskPerLot > 0 ? floorToStep(riskAmount / riskPerLot, input.lotStep) : 0;
  const actualRisk = lots * riskPerLot;
  return {
    riskAmount,
    lots,
    actualRisk,
    lossesToDailyLimit: lossesWithin(input.balance * (input.dailyLossPercent / 100), actualRisk),
    lossesToMaxLoss: lossesWithin(input.balance * (input.maxLossPercent / 100), actualRisk),
  };
}
