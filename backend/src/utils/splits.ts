import { ApiError } from "./ApiError";

export type SplitType = "equal" | "percentage" | "custom";
export type SplitConfig = { shares?: Record<string, number> };

export type SplitShare = {
  member: string;
  amount: number;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const calculateSplitShares = (
  amount: number,
  members: string[],
  splitType: SplitType,
  splitConfig: SplitConfig = {}
): SplitShare[] => {
  if (!members.length) {
    throw new ApiError(400, "Household must have members to split expenses");
  }

  if (splitType === "equal") {
    const base = roundMoney(amount / members.length);
    let assigned = 0;
    return members.map((member, index) => {
      const share = index === members.length - 1 ? roundMoney(amount - assigned) : base;
      assigned += share;
      return { member, amount: share };
    });
  }

  const shares = splitConfig.shares ?? {};
  const missing = members.filter((member) => shares[member] === undefined);

  if (missing.length) {
    throw new ApiError(400, `Missing split share for: ${missing.join(", ")}`);
  }

  if (splitType === "percentage") {
    const totalPercentage = Object.values(shares).reduce((sum, item) => sum + item, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new ApiError(400, "Percentage split must add up to 100");
    }
    return members.map((member) => ({ member, amount: roundMoney((amount * shares[member]) / 100) }));
  }

  const totalAmount = Object.values(shares).reduce((sum, item) => sum + item, 0);
  if (Math.abs(totalAmount - amount) > 0.01) {
    throw new ApiError(400, "Custom split must add up to the transaction amount");
  }
  return members.map((member) => ({ member, amount: roundMoney(shares[member]) }));
};

export const calculateCompensation = (
  amount: number,
  paidBy: string,
  members: string[],
  splitType: SplitType,
  splitConfig?: SplitConfig
) => {
  const shares = calculateSplitShares(amount, members, splitType, splitConfig);
  const net = Object.fromEntries(members.map((member) => [member, 0]));

  shares.forEach((share) => {
    net[share.member] -= share.amount;
  });
  net[paidBy] = roundMoney((net[paidBy] ?? 0) + amount);

  return {
    shares,
    net: Object.fromEntries(Object.entries(net).map(([member, value]) => [member, roundMoney(value)]))
  };
};

