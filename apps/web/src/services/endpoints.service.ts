export const ENDPOINTS = {
  auth: {
    register: 'auth/register/',
    login: 'auth/login/',
    logout: 'auth/logout/',
    refresh: 'auth/token/refresh/',
    profile: 'auth/profile/',
    changePassword: 'auth/change-password/',
  },
  products: {
    categories: 'products/categories/',
    categoryById: (id: number) => `products/categories/${id}/`,
    items: 'products/items/',
    itemById: (id: number) => `products/items/${id}/`,
    sizes: 'products/items/sizes/',
  },
  pos: {
    dashboard: 'pos/dashboard/',
    transactions: 'pos/transactions/',
    transactionById: (id: number) => `pos/transactions/${id}/`,
  },
  customers: {
    list: 'customers/',
    byId: (id: number) => `customers/${id}/`,
  },
  returns: {
    list: 'returns/',
    byId: (id: number) => `returns/${id}/`,
  },
} as const;
