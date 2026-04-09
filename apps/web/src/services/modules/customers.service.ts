import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export interface CustomerListQuery {
  q?: string;
  active?: "all" | "active" | "inactive";
  page?: number;
  pageSize?: number;
}

export interface CustomerRow {
  id: number;
  customerCode: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  addressCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  results: CustomerRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export async function fetchCustomers(query: CustomerListQuery = {}): Promise<CustomerListResponse> {
  const params: Record<string, string> = {};

  if (query.q) {
    params.q = query.q;
  }
  if (query.active && query.active !== "all") {
    params.active = query.active === "active" ? "true" : "false";
  }
  if (query.page) {
    params.page = String(query.page);
  }
  if (query.pageSize) {
    params.page_size = String(query.pageSize);
  }

  const { data } = await api.get<CustomerListResponse>(ENDPOINTS.customers.list, {
    params,
  });
  return data;
}
