/**
 * Prop firm drawdown: where the daily loss floor and the overall (static or
 * trailing) floor sit, and how much room is left before each is hit.
 * Percents are percents (5 means 5%).
 */

/** What the daily loss limit is measured from. Firms differ; these are the common three. */
export type DailyBasis = "starting_balance" | "day_start_balance" | "day_start_higher";

/** How the overall loss floor moves. */
export type DrawdownType = "static" | "trailing" | "trailing_lock";

export interface DrawdownInput {
  startingBalance: number;
  maxLossPercent: number;
  dailyLossPercent: number;
  dailyBasis: DailyBasis;
  drawdownType: DrawdownType;
  /** Balance and equity at the start of today's trading day. */
  dayStartBalance: number;
  dayStartEquity: number;
  /** Equity now, including open trades. */
  equity: number;
  /** Highest equity the account has reached (for trailing drawdown). */
  highWaterMark: number;
}

export interface DrawdownResult {
  dailyLimit: number;
  dailyFloor: number;
  dailyRoom: number;
  overallFloor: number;
  overallRoom: number;
  /** The floor that is hit first if equity keeps falling. */
  binding: "daily" | "overall";
  breached: boolean;
}

const pct = (p: number) => p / 100;

/** The equity level today's losses may not go below. */
export function dailyFloor(input: DrawdownInput): { limit: number; floor: number } {
  const from =
    input.dailyBasis === "day_start_higher"
      ? Math.max(input.dayStartBalance, input.dayStartEquity)
      : input.dayStartBalance;
  const base = input.dailyBasis === "starting_balance" ? input.startingBalance : from;
  const limit = base * pct(input.dailyLossPercent);
  return { limit, floor: from - limit };
}

/**
 * The overall floor. Static: starting balance less the max loss. Trailing: the
 * high-water mark less the same amount. Trailing with lock: trails until it
 * reaches the starting balance, then stays there.
 */
export function overallFloor(input: DrawdownInput): number {
  const amount = input.startingBalance * pct(input.maxLossPercent);
  const staticFloor = input.startingBalance - amount;
  if (input.drawdownType === "static") return staticFloor;
  const trailed = Math.max(staticFloor, Math.max(input.highWaterMark, input.startingBalance) - amount);
  return input.drawdownType === "trailing_lock" ? Math.min(trailed, input.startingBalance) : trailed;
}

export function drawdown(input: DrawdownInput): DrawdownResult {
  const daily = dailyFloor(input);
  const overall = overallFloor(input);
  const binding = daily.floor >= overall ? "daily" : "overall";
  return {
    dailyLimit: daily.limit,
    dailyFloor: daily.floor,
    dailyRoom: input.equity - daily.floor,
    overallFloor: overall,
    overallRoom: input.equity - overall,
    binding,
    breached: input.equity <= Math.max(daily.floor, overall),
  };
}
