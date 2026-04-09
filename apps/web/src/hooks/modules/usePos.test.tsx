import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePosCatalog } from "@/hooks/modules/usePos";
import * as posService from "@/services/modules/pos.service";

vi.mock("@/services/modules/pos.service", () => ({
  fetchPosCategories: vi.fn(),
  fetchPosProducts: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("usePosCatalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches categories and products using shared query input", async () => {
    const query = { categoryId: 2, search: "spark" };
    const categories = [{ id: 2, name: "Engine" }];
    const products = [{ id: 10, sku: "SPARK-01" }];

    vi.mocked(posService.fetchPosCategories).mockResolvedValue(categories as never);
    vi.mocked(posService.fetchPosProducts).mockResolvedValue(products as never);

    const { result } = renderHook(() => usePosCatalog(query), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.categoriesQuery.isSuccess).toBe(true);
      expect(result.current.productsQuery.isSuccess).toBe(true);
    });

    expect(posService.fetchPosCategories).toHaveBeenCalledTimes(1);
    expect(posService.fetchPosProducts).toHaveBeenCalledWith(query);
    expect(result.current.categoriesQuery.data).toEqual(categories);
    expect(result.current.productsQuery.data).toEqual(products);
  });
});
