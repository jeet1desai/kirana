import { Product, PriceHistory, ActivityLog, UserProfile } from "../types";

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user_ramesh",
    name: "Ramesh",
    role: "Admin",
    shortName: "Ramesh",
    color: "#2563EB",
  },
  {
    id: "user_suresh",
    name: "Suresh",
    role: "Manager",
    shortName: "Suresh",
    color: "#7C3AED",
  },
];

// No dummy products - clean slate powered by Neon PostgreSQL
export const INITIAL_PRODUCTS: Product[] = [];

// No dummy price history
export const INITIAL_PRICE_HISTORY: PriceHistory[] = [];

// No dummy activity logs
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
