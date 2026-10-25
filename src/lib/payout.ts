/**
 * A funded trader's payout: the trader's share of the profit, plus a refunded
 * challenge fee if the firm pays one back, less any withdrawal fee. And the
 * reverse: how much profit a target payout needs.
 */

export interface PayoutInput {
  accountSize: number;
  profit: number;
  splitPercent: number;
  /** Challenge fee refunded with this payout (0 if none). */
  feeRefund: number;
  /** Fixed withdrawal or transfer fee (0 if none). */
  withdrawalFee: number;
  /** A payout the trader wants to reach, for the reverse calculation. */
  targetPayout: number;
}

export interface PayoutResult {
  traderShare: number;
  firmShare: number;
  payout: number;
  /** Profit as a share of the account size, in percent. */
  returnPercent: number;
  /** Profit needed for targetPayout at this split, ignoring the refund. */
  profitForTarget: number;
  returnForTargetPercent: number;
}

export function payout(input: PayoutInput): PayoutResult {
  const split = input.splitPercent / 100;
  const profit = Math.max(0, input.profit);
  const traderShare = profit * split;
  const profitForTarget = split > 0 ? (input.targetPayout + input.withdrawalFee) / split : 0;
  const percentOf = (amount: number) =>
    input.accountSize > 0 ? (amount / input.accountSize) * 100 : 0;
  return {
    traderShare,
    firmShare: profit - traderShare,
    payout: Math.max(0, traderShare + input.feeRefund - input.withdrawalFee),
    returnPercent: percentOf(profit),
    profitForTarget,
    returnForTargetPercent: percentOf(profitForTarget),
  };
}
