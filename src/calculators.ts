/** The five calculators: their inputs, defaults and how results are worded. */
import { challengeCost } from "./lib/challenge-cost";
import { type DailyBasis, type DrawdownType, drawdown } from "./lib/drawdown";
import { payout } from "./lib/payout";
import { positionSize } from "./lib/position-size";
import { revenue } from "./lib/revenue";
import { count, money, percent } from "./ui/format";
import type { Calculator, Values } from "./ui/mount";

const n = (v: Values, k: string) => Number(v[k]) || 0;

/** Pass rates published by the PropSim Prop Trading Index, week of 2026-10-19. */
const INDEX_PHASE1 = 14.1;
const INDEX_PHASE2 = 34;
const INDEX_HINT = "Default: the Prop Trading Index average, week of 2026-10-19.";

export const DRAWDOWN: Calculator = {
  fields: [
    { kind: "number", id: "start", label: "Starting balance", value: 100_000, prefix: "$", min: 0 },
    { kind: "number", id: "maxLoss", label: "Maximum loss", value: 10, suffix: "%", min: 0, step: 0.5 },
    { kind: "number", id: "dailyLoss", label: "Daily loss limit", value: 5, suffix: "%", min: 0, step: 0.5 },
    {
      kind: "select",
      id: "basis",
      label: "Daily limit measured from",
      value: "starting_balance",
      options: [
        ["starting_balance", "% of starting balance, from today's opening balance"],
        ["day_start_balance", "% of today's opening balance"],
        ["day_start_higher", "% of the higher of today's opening balance or equity"],
      ],
      hint: "Firms differ. Check your firm's rules for which one applies.",
    },
    {
      kind: "select",
      id: "type",
      label: "Maximum loss type",
      value: "static",
      options: [
        ["static", "Static: fixed below the starting balance"],
        ["trailing", "Trailing: follows your highest equity"],
        ["trailing_lock", "Trailing, locks at the starting balance"],
      ],
    },
    { kind: "number", id: "dayBalance", label: "Today's opening balance", value: 101_200, prefix: "$" },
    { kind: "number", id: "dayEquity", label: "Today's opening equity", value: 101_500, prefix: "$" },
    { kind: "number", id: "equity", label: "Equity now", value: 99_800, prefix: "$" },
    { kind: "number", id: "hwm", label: "Highest equity so far", value: 102_400, prefix: "$", hint: "Used by trailing drawdown." },
  ],
  compute: (v) => {
    const r = drawdown({
      startingBalance: n(v, "start"),
      maxLossPercent: n(v, "maxLoss"),
      dailyLossPercent: n(v, "dailyLoss"),
      dailyBasis: v.basis as DailyBasis,
      drawdownType: v.type as DrawdownType,
      dayStartBalance: n(v, "dayBalance"),
      dayStartEquity: n(v, "dayEquity"),
      equity: n(v, "equity"),
      highWaterMark: n(v, "hwm"),
    });
    const room = Math.min(r.dailyRoom, r.overallRoom);
    return [
      r.breached
        ? { label: "Status", value: "Limit breached", tone: "bad", primary: true, note: "Equity is at or below a floor." }
        : { label: "You can lose before a breach", value: money(room), tone: "good", primary: true, note: `The ${r.binding === "daily" ? "daily loss" : "maximum loss"} floor comes first.` },
      { label: "Today's daily loss limit", value: money(r.dailyLimit) },
      { label: "Daily floor (equity must stay above)", value: money(r.dailyFloor), note: `${money(r.dailyRoom)} of room today` },
      { label: "Maximum loss floor", value: money(r.overallFloor), note: `${money(r.overallRoom)} of room overall` },
    ];
  },
};

export const POSITION_SIZE: Calculator = {
  fields: [
    { kind: "number", id: "balance", label: "Account balance", value: 100_000, prefix: "$", min: 0 },
    { kind: "number", id: "risk", label: "Risk per trade", value: 0.5, suffix: "%", min: 0, step: 0.1 },
    { kind: "number", id: "stop", label: "Stop loss", value: 20, suffix: "pips", min: 0, step: 0.1 },
    {
      kind: "number",
      id: "pipValue",
      label: "Pip value per 1.00 lot",
      value: 10,
      prefix: "$",
      min: 0,
      step: 0.01,
      hint: "$10 for EUR/USD, GBP/USD and other USD-quoted majors on a USD account. Check your broker's contract specification for other symbols.",
    },
    { kind: "number", id: "lotStep", label: "Lot step", value: 0.01, min: 0, step: 0.01 },
    { kind: "number", id: "dailyLoss", label: "Daily loss limit", value: 5, suffix: "%", min: 0, step: 0.5 },
    { kind: "number", id: "maxLoss", label: "Maximum loss", value: 10, suffix: "%", min: 0, step: 0.5 },
  ],
  compute: (v) => {
    const r = positionSize({
      balance: n(v, "balance"),
      riskPercent: n(v, "risk"),
      stopLossPips: n(v, "stop"),
      pipValuePerLot: n(v, "pipValue"),
      lotStep: n(v, "lotStep"),
      dailyLossPercent: n(v, "dailyLoss"),
      maxLossPercent: n(v, "maxLoss"),
    });
    return [
      { label: "Position size", value: `${r.lots.toFixed(2)} lots`, primary: true, note: `Rounded down to your lot step` },
      { label: "Money at risk", value: money(r.actualRisk), note: `Target ${money(r.riskAmount)}` },
      { label: "Losing trades in a row to the daily limit", value: count(r.lossesToDailyLimit, 0) },
      { label: "Losing trades in a row to the maximum loss", value: count(r.lossesToMaxLoss, 0) },
    ];
  },
};

export const CHALLENGE_COST: Calculator = {
  fields: [
    { kind: "number", id: "fee", label: "Challenge fee", value: 549, prefix: "$", min: 0 },
    { kind: "select", id: "steps", label: "Challenge type", value: "2", options: [["2", "Two-step"], ["1", "One-step"]] },
    { kind: "number", id: "p1", label: "Phase 1 pass rate", value: INDEX_PHASE1, suffix: "%", min: 0, step: 0.1, hint: INDEX_HINT },
    { kind: "number", id: "p2", label: "Phase 2 pass rate", value: INDEX_PHASE2, suffix: "%", min: 0, step: 0.1, hint: "Of traders who reach phase 2. Ignored for one-step." },
    { kind: "number", id: "discount", label: "Discount on retries", value: 0, suffix: "%", min: 0, step: 5 },
    { kind: "toggle", id: "refund", label: "Fee refunded with the first payout", value: true },
  ],
  compute: (v) => {
    const r = challengeCost({
      fee: n(v, "fee"),
      steps: v.steps === "1" ? 1 : 2,
      phase1PassPercent: n(v, "p1"),
      phase2PassPercent: n(v, "p2"),
      retryDiscountPercent: n(v, "discount"),
      feeRefunded: v.refund === true,
    });
    return [
      { label: "Expected cost to get funded", value: money(r.expectedSpend), primary: true, note: `About ${count(r.expectedAttempts)} attempts on average` },
      { label: "Chance one attempt gets funded", value: percent(r.fundedChance * 100) },
      { label: "Chance within three attempts", value: percent(r.chanceWithinThree * 100) },
      { label: "After the refunded fee", value: money(r.netAfterRefund), note: v.refund === true ? "Once funded and paid out" : "No refund selected" },
    ];
  },
};

export const PAYOUT: Calculator = {
  fields: [
    { kind: "number", id: "size", label: "Account size", value: 100_000, prefix: "$", min: 0 },
    { kind: "number", id: "profit", label: "Profit this payout period", value: 6_000, prefix: "$" },
    { kind: "number", id: "split", label: "Your profit split", value: 80, suffix: "%", min: 0, max: 100, step: 5 },
    { kind: "number", id: "refund", label: "Challenge fee refunded", value: 549, prefix: "$", min: 0, hint: "Set to 0 if your firm doesn't refund, or already did." },
    { kind: "number", id: "fee", label: "Withdrawal fee", value: 0, prefix: "$", min: 0 },
    { kind: "number", id: "target", label: "Payout you want", value: 5_000, prefix: "$", min: 0 },
  ],
  compute: (v) => {
    const r = payout({
      accountSize: n(v, "size"),
      profit: n(v, "profit"),
      splitPercent: n(v, "split"),
      feeRefund: n(v, "refund"),
      withdrawalFee: n(v, "fee"),
      targetPayout: n(v, "target"),
    });
    return [
      { label: "Your payout", value: money(r.payout), primary: true, note: `${money(r.traderShare)} profit share + refund − fees` },
      { label: "Firm's share of the profit", value: money(r.firmShare) },
      { label: "Return on the account", value: percent(r.returnPercent, 2) },
      { label: `Profit needed for a ${money(n(v, "target"))} payout`, value: money(r.profitForTarget), note: `${percent(r.returnForTargetPercent, 2)} of the account` },
    ];
  },
};

export const REVENUE: Calculator = {
  fields: [
    { kind: "number", id: "sold", label: "Challenges sold a month", value: 300, min: 0 },
    { kind: "number", id: "price", label: "Average challenge price", value: 180, prefix: "$", min: 0 },
    { kind: "number", id: "processing", label: "Payment processing", value: 4, suffix: "%", min: 0, step: 0.5 },
    { kind: "number", id: "affiliates", label: "Affiliate commission", value: 10, suffix: "%", min: 0, step: 1 },
    { kind: "number", id: "p1", label: "Phase 1 pass rate", value: INDEX_PHASE1, suffix: "%", min: 0, step: 0.1, hint: INDEX_HINT },
    { kind: "number", id: "p2", label: "Phase 2 pass rate", value: INDEX_PHASE2, suffix: "%", min: 0, step: 0.1 },
    { kind: "number", id: "paid", label: "Funded traders who reach a payout", value: 40, suffix: "%", min: 0, step: 5, hint: "Your own assumption." },
    { kind: "number", id: "avgPayout", label: "Average payout", value: 1_500, prefix: "$", min: 0 },
    { kind: "number", id: "platformMonthly", label: "Platform cost a month", value: 500, prefix: "$", min: 0 },
    { kind: "number", id: "platformPer", label: "Platform cost per account", value: 3, prefix: "$", min: 0, step: 0.5 },
  ],
  compute: (v) => {
    const r = revenue({
      challengesPerMonth: n(v, "sold"),
      averagePrice: n(v, "price"),
      processingPercent: n(v, "processing"),
      affiliatePercent: n(v, "affiliates"),
      phase1PassPercent: n(v, "p1"),
      phase2PassPercent: n(v, "p2"),
      paidOutPercent: n(v, "paid"),
      averagePayout: n(v, "avgPayout"),
      platformMonthly: n(v, "platformMonthly"),
      platformPerAccount: n(v, "platformPer"),
    });
    return [
      { label: "Net a month", value: money(r.net), primary: true, tone: r.net >= 0 ? "good" : "bad", note: `${percent(r.marginPercent)} of sales` },
      { label: "Challenge sales", value: money(r.gross) },
      { label: "Payouts to funded traders", value: money(r.payouts), note: `${count(r.fundedTraders)} funded, ${count(r.paidTraders)} paid` },
      { label: "Processing and affiliates", value: money(r.processing + r.affiliates) },
      { label: "Platform", value: money(r.platform) },
    ];
  },
};

export const CALCULATORS: Record<string, Calculator> = {
  drawdown: DRAWDOWN,
  "position-size": POSITION_SIZE,
  "challenge-cost": CHALLENGE_COST,
  payout: PAYOUT,
  revenue: REVENUE,
};
