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
};
