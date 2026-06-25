import {
  Landmark,
  Home as HomeIcon,
  Zap,
  ShoppingCart,
  Heart,
  Car,
  ShoppingBag,
  Film,
  ShieldAlert,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Repeat,
  Gift,
  TrendingDown,
  TrendingUp,
  Wallet,
  Target,
  Percent,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  { id: "loan", label: "Loan Repayment", icon: Landmark, color: "#e0654a" },
  { id: "rent", label: "House Rent", icon: HomeIcon, color: "#c98a5a" },
  { id: "utilities", label: "Utilities", icon: Zap, color: "#e3a847" },
  { id: "groceries", label: "Groceries", icon: ShoppingCart, color: "#7ba05b" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "#d96477" },
  {
    id: "transport",
    label: "Transport & Vehicle",
    icon: Car,
    color: "#8a7555",
  },
  {
    id: "shopping-household",
    label: "Shopping & Household",
    icon: ShoppingBag,
    color: "#9878c0",
  },
  {
    id: "entertainment",
    label: "Entertainment & Dining",
    icon: Film,
    color: "#e08a5f",
  },
  {
    id: "insurance",
    label: "Insurance & Premiums",
    icon: ShieldAlert,
    color: "#5a8ba3",
  },
  {
    id: "card-interest",
    label: "Card Interest & Fees",
    icon: Percent,
    color: "#c64a6f",
  },
  {
    id: "savings-investments",
    label: "Savings & Investments",
    icon: PiggyBank,
    color: "#4a9b7a",
  },
  {
    id: "other",
    label: "Other Expenses",
    icon: MoreHorizontal,
    color: "#8a8075",
  },
];

export const INCOME_CATEGORIES = [
  { id: "fixed", label: "Fixed Income", icon: Briefcase, color: "#4a9b7a" },
  {
    id: "emergency",
    label: "Emergency Funds",
    icon: ShieldAlert,
    color: "#e3a847",
  },
  { id: "passive", label: "Passive Income", icon: Repeat, color: "#7ba05b" },
  { id: "bonus", label: "Bonus & Rewards", icon: Gift, color: "#d96477" },
  {
    id: "refund",
    label: "Refunds & Reimbursements",
    icon: TrendingDown,
    color: "#5a8ba3",
  },
  {
    id: "other-income",
    label: "Other Income",
    icon: MoreHorizontal,
    color: "#8a8075",
  },
];

export const ICON_MAP = {
  Briefcase,
  Repeat,
  Gift,
  TrendingDown,
  TrendingUp,
  Wallet,
  Target,
  Landmark,
  HomeIcon,
  Zap,
  ShoppingCart,
  Heart,
  Car,
  ShoppingBag,
  Film,
  ShieldAlert,
  PiggyBank,
  MoreHorizontal,
  Percent,
};

export const getIconName = (ic) =>
  Object.entries(ICON_MAP).find(([, v]) => v === ic)?.[0] || "MoreHorizontal";

export const ICON_OPTIONS = Object.entries(ICON_MAP).map(([name, icon]) => ({
  name,
  icon,
}));

export const CUSTOM_CAT_COLORS = [
  "#e0654a",
  "#c98a5a",
  "#e3a847",
  "#7ba05b",
  "#4a9b7a",
  "#d96477",
  "#5a8ba3",
  "#9878c0",
  "#e08a5f",
  "#c64a6f",
  "#a594f9",
  "#8a8075",
];

export const getCat = (id, type, expList, incList) => {
  const list =
    type === "income"
      ? incList || INCOME_CATEGORIES
      : expList || EXPENSE_CATEGORIES;
  return list.find((c) => c.id === id) || list[list.length - 1];
};
