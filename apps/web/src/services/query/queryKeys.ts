export interface DashboardSnapshotQueryKeyInput {
  days: number;
}

export interface TransactionListQueryKeyInput {
  q?: string;
  status?: string;
  paymentMethod?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CatalogProductQueryKeyInput {
  category?: number;
  available?: boolean;
  size?: string;
  search?: string;
}

export interface PosCatalogQueryKeyInput {
  categoryId?: number;
  search?: string;
}

export interface ReturnListQueryKeyInput {
  q?: string;
  status?: "all_returns" | "refunded" | "partially_refunded";
  days?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerListQueryKeyInput {
  q?: string;
  active?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface ReportsSnapshotQueryKeyInput {
  days: 7 | 30;
}

export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    snapshot: (input: DashboardSnapshotQueryKeyInput) =>
      ["dashboard", "snapshot", input] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (input: TransactionListQueryKeyInput) =>
      ["transactions", "list", input] as const,
    detail: (id: number) => ["transactions", "detail", id] as const,
  },
  catalog: {
    all: ["catalog"] as const,
    categories: ["catalog", "categories"] as const,
    products: (input: CatalogProductQueryKeyInput = {}) =>
      ["catalog", "products", input] as const,
    sizes: ["catalog", "sizes"] as const,
  },
  pos: {
    all: ["pos"] as const,
    categories: ["pos", "categories"] as const,
    products: (input: PosCatalogQueryKeyInput = {}) =>
      ["pos", "products", input] as const,
  },
  returns: {
    all: ["returns"] as const,
    list: (input: ReturnListQueryKeyInput) =>
      ["returns", "list", input] as const,
    detail: (id: number) => ["returns", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (input: CustomerListQueryKeyInput) =>
      ["customers", "list", input] as const,
  },
  reports: {
    all: ["reports"] as const,
    snapshot: (input: ReportsSnapshotQueryKeyInput) =>
      ["reports", "snapshot", input] as const,
  },
};
