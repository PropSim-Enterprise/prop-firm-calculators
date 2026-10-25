import { describe, expect, it } from "vitest";
import { challengeCost, fundedChance } from "./challenge-cost";
import { type DrawdownInput, dailyFloor, drawdown, overallFloor } from "./drawdown";
import { payout } from "./payout";
import { floorToStep, positionSize } from "./position-size";
import { revenue } from "./revenue";

const account: DrawdownInput = {
  startingBalance: 100_000,
  maxLossPercent: 10,
  dailyLossPercent: 5,
  dailyBasis: "starting_balance",
  drawdownType: "static",
  dayStartBalance: 102_000,
  dayStartEquity: 103_000,
  equity: 101_000,
  highWaterMark: 104_000,
};

describe("drawdown", () => {
  it("daily limit from the starting balance, measured from the day's start balance", () => {
    expect(dailyFloor(account)).toEqual({ limit: 5_000, floor: 97_000 });
  });

  it("daily limit from the day's start balance", () => {
    expect(dailyFloor({ ...account, dailyBasis: "day_start_balance" })).toEqual({
      limit: 5_100,
      floor: 96_900,
    });
  });

  it("daily limit from the higher of the day's start balance and equity", () => {
    expect(dailyFloor({ ...account, dailyBasis: "day_start_higher" })).toEqual({
      limit: 5_150,
      floor: 97_850,
    });
  });

  it("static floor is the starting balance less the max loss", () => {
    expect(overallFloor(account)).toBe(90_000);
  });

  it("trailing floor follows the high-water mark", () => {
    expect(overallFloor({ ...account, drawdownType: "trailing" })).toBe(94_000);
  });

  it("trailing floor never starts below the static floor", () => {
    expect(overallFloor({ ...account, drawdownType: "trailing", highWaterMark: 99_000 })).toBe(
      90_000,
    );
  });

  it("trailing floor with lock stops at the starting balance", () => {
    const locked = { ...account, drawdownType: "trailing_lock" as const, highWaterMark: 112_000 };
    expect(overallFloor(locked)).toBe(100_000);
    expect(overallFloor({ ...locked, highWaterMark: 104_000 })).toBe(94_000);
  });

  it("reports room, the binding floor and a breach", () => {
    const r = drawdown(account);
    expect(r.dailyRoom).toBe(4_000);
    expect(r.overallRoom).toBe(11_000);
    expect(r.binding).toBe("daily");
    expect(r.breached).toBe(false);
    expect(drawdown({ ...account, equity: 96_999 }).breached).toBe(true);
  });

  it("binding floor is the overall one when it is higher", () => {
    const r = drawdown({ ...account, drawdownType: "trailing", highWaterMark: 110_000 });
    expect(r.overallFloor).toBe(100_000);
    expect(r.binding).toBe("overall");
  });
});

describe("position size", () => {
  const input = {
    balance: 100_000,
    riskPercent: 0.5,
    stopLossPips: 20,
    pipValuePerLot: 10,
    lotStep: 0.01,
    dailyLossPercent: 5,
    maxLossPercent: 10,
  };

  it("sizes the lot to the risk", () => {
    const r = positionSize(input);
    expect(r.riskAmount).toBe(500);
    expect(r.lots).toBe(2.5);
    expect(r.actualRisk).toBe(500);
    expect(r.lossesToDailyLimit).toBe(10);
    expect(r.lossesToMaxLoss).toBe(20);
  });

  it("rounds down to the lot step so risk never exceeds the target", () => {
    const r = positionSize({ ...input, stopLossPips: 17 });
    expect(r.lots).toBe(2.94);
    expect(r.actualRisk).toBeLessThanOrEqual(500);
  });

  it("floorToStep avoids floating-point drift", () => {
    expect(floorToStep(0.3, 0.01)).toBe(0.3);
    expect(floorToStep(0.299999, 0.01)).toBe(0.29);
    expect(floorToStep(7, 1)).toBe(7);
  });

  it("a zero stop gives no position", () => {
    const r = positionSize({ ...input, stopLossPips: 0 });
    expect(r.lots).toBe(0);
    expect(r.lossesToDailyLimit).toBe(0);
  });
});

describe("challenge cost", () => {
  const input = {
    fee: 500,
    steps: 2 as const,
    phase1PassPercent: 20,
    phase2PassPercent: 50,
    retryDiscountPercent: 0,
    feeRefunded: false,
  };

  it("two steps multiply the pass rates", () => {
    expect(fundedChance(input)).toBeCloseTo(0.1);
    expect(fundedChance({ ...input, steps: 1 })).toBeCloseTo(0.2);
  });

  it("expected attempts and spend", () => {
    const r = challengeCost(input);
    expect(r.expectedAttempts).toBeCloseTo(10);
    expect(r.expectedSpend).toBeCloseTo(5_000);
    expect(r.chanceWithinThree).toBeCloseTo(1 - 0.9 ** 3);
  });

  it("retry discount applies after the first attempt", () => {
    expect(challengeCost({ ...input, retryDiscountPercent: 20 }).expectedSpend).toBeCloseTo(
      500 + 9 * 400,
    );
  });

  it("refund is the expected fee of the passing attempt", () => {
    const r = challengeCost({ ...input, retryDiscountPercent: 20, feeRefunded: true });
    expect(r.netAfterRefund).toBeCloseTo(r.expectedSpend - (0.1 * 500 + 0.9 * 400));
  });

  it("a zero pass rate never funds", () => {
    const r = challengeCost({ ...input, phase1PassPercent: 0 });
    expect(r.fundedChance).toBe(0);
    expect(r.expectedAttempts).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("payout", () => {
  const input = {
    accountSize: 100_000,
    profit: 6_000,
    splitPercent: 80,
    feeRefund: 500,
    withdrawalFee: 25,
    targetPayout: 4_000,
  };

  it("splits the profit and adds the refund", () => {
    const r = payout(input);
    expect(r.traderShare).toBe(4_800);
    expect(r.firmShare).toBe(1_200);
    expect(r.payout).toBe(5_275);
    expect(r.returnPercent).toBe(6);
  });

  it("works out the profit a target payout needs", () => {
    const r = payout(input);
    expect(r.profitForTarget).toBeCloseTo(5_031.25);
    expect(r.returnForTargetPercent).toBeCloseTo(5.03125);
  });

  it("a loss pays nothing", () => {
    expect(payout({ ...input, profit: -1_000, feeRefund: 0 }).payout).toBe(0);
  });
});

describe("revenue", () => {
  const input = {
    challengesPerMonth: 200,
    averagePrice: 200,
    processingPercent: 4,
    affiliatePercent: 10,
    phase1PassPercent: 15,
    phase2PassPercent: 40,
    paidOutPercent: 50,
    averagePayout: 2_000,
    platformMonthly: 500,
    platformPerAccount: 5,
  };

  it("adds up a month", () => {
    const r = revenue(input);
    expect(r.gross).toBe(40_000);
    expect(r.processing).toBe(1_600);
    expect(r.affiliates).toBe(4_000);
    expect(r.platform).toBe(1_500);
    expect(r.fundedTraders).toBeCloseTo(12);
    expect(r.paidTraders).toBeCloseTo(6);
    expect(r.payouts).toBeCloseTo(12_000);
    expect(r.net).toBeCloseTo(20_900);
    expect(r.marginPercent).toBeCloseTo(52.25);
  });

  it("no sales means no margin, not a division by zero", () => {
    expect(revenue({ ...input, challengesPerMonth: 0, platformMonthly: 0 }).marginPercent).toBe(0);
  });
});
