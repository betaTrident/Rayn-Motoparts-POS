import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";
import {
  fetchCategories,
  fetchProducts,
  type Category,
  type Product,
} from "@/services/modules/catalog.service";

export interface PosCatalogQuery {
  categoryId?: number;
  search?: string;
}

export interface PosPaymentMethod {
  id: number;
  code: string;
  name: string;
}

export interface PosCashSession {
  id: number;
  sessionCode: string;
  status: string;
  openingBalance: number;
  expectedCashBalance: number;
  openedAt: string;
}

export interface PosBootstrapResponse {
  cashSession: PosCashSession | null;
  paymentMethods: PosPaymentMethod[];
}

export interface OpenCashSessionPayload {
  opening_balance?: number;
}

export interface OpenCashSessionResponse {
  cashSession: PosCashSession;
  created: boolean;
}

export interface PosCheckoutPayload {
  cash_session_id: number;
  customer_id?: number;
  customer_name?: string;
  items: Array<{
    variant_id: number;
    qty: number;
  }>;
  payments: Array<{
    payment_method_id: number;
    amount: number;
    reference_number?: string | null;
  }>;
  notes?: string;
}

export interface PosCheckoutResponse {
  transaction: {
    id: number;
    transactionNumber: string;
    status: string;
    customerName: string | null;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountTendered: number;
    changeGiven: number;
  };
  receiptSnapshotEnabled?: boolean;
  receipt: {
    id: number;
    receiptNumber: string;
  } | null;
}

export async function fetchPosCategories(): Promise<Category[]> {
  return fetchCategories(true);
}

export async function fetchPosProducts(query: PosCatalogQuery = {}): Promise<Product[]> {
  return fetchProducts({
    category: query.categoryId,
    search: query.search,
    available: true,
  });
}

export async function fetchPosBootstrap(): Promise<PosBootstrapResponse> {
  const { data } = await api.get<PosBootstrapResponse>(ENDPOINTS.pos.bootstrap);
  return data;
}

export async function fetchCurrentCashSession(): Promise<PosCashSession | null> {
  const { data } = await api.get<{ cashSession: PosCashSession | null }>(
    ENDPOINTS.pos.currentCashSession,
  );
  return data.cashSession;
}

export async function fetchPaymentMethods(): Promise<PosPaymentMethod[]> {
  const { data } = await api.get<PosPaymentMethod[]>(ENDPOINTS.pos.paymentMethods);
  return data;
}

export async function checkoutPos(payload: PosCheckoutPayload): Promise<PosCheckoutResponse> {
  const { data } = await api.post<PosCheckoutResponse>(ENDPOINTS.pos.checkout, payload);
  return data;
}

export async function openCashSession(
  payload: OpenCashSessionPayload = {},
): Promise<OpenCashSessionResponse> {
  const { data } = await api.post<OpenCashSessionResponse>(
    ENDPOINTS.pos.openCashSession,
    payload,
  );
  return data;
}
