/**
 * A steady-state month for a prop firm: challenge sales, less payment
 * processing, affiliate commission, platform costs and payouts to funded
 * traders. Every input is an assumption the founder sets.
 */

export interface RevenueInput {
  challengesPerMonth: number;
  averagePrice: number;
  /** Payment processing, percent of sales. */
  processingPercent: number;
  /** Affiliate commission, percent of sales. */
  affiliatePercent: number;
  phase1PassPercent: number;
  phase2PassPercent: number;
  /** Share of funded traders who reach a payout, percent. */
  paidOutPercent: number;
  averagePayout: number;
  platformMonthly: number;
  platformPerAccount: number;
}

export interface RevenueResult {
  gross: number;
  processing: number;
  affiliates: number;
  platform: number;
  fundedTraders: number;
  paidTraders: number;
  payouts: number;
  net: number;
  /** Net as a percent of gross (0 when there are no sales). */
  marginPercent: number;
}

export function revenue(input: RevenueInput): RevenueResult {
  const gross = input.challengesPerMonth * input.averagePrice;
  const processing = gross * (input.processingPercent / 100);
  const affiliates = gross * (input.affiliatePercent / 100);
  const platform = input.platformMonthly + input.challengesPerMonth * input.platformPerAccount;
  const fundedTraders =
    input.challengesPerMonth * (input.phase1PassPercent / 100) * (input.phase2PassPercent / 100);
  const paidTraders = fundedTraders * (input.paidOutPercent / 100);
  const payouts = paidTraders * input.averagePayout;
  const net = gross - processing - affiliates - platform - payouts;
  return {
    gross,
    processing,
    affiliates,
    platform,
    fundedTraders,
    paidTraders,
    payouts,
    net,
    marginPercent: gross > 0 ? (net / gross) * 100 : 0,
  };
}
