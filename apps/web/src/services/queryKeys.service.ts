export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
  },
  products: {
    all: ['products'] as const,
    byFilters: (filters?: Record<string, unknown>) =>
      ['products', 'list', filters ?? {}] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    detail: (id: number) => ['categories', 'detail', id] as const,
  },
};
