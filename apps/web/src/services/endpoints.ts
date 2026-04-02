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
    warehouses: 'pos/warehouses/',
    transactions: 'pos/transactions/',
  },
} as const;
