import { apiClient } from './client';
import {
  Customer,
  Product,
  SalesChallan,
  FollowUp,
  StockMovement,
  AuditLogItem,
  NotificationItem,
  DashboardStats,
  Warehouse,
  Category,
  User,
} from '../types';

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post<{ token: string; user: User }>('/auth/login', credentials),
    getMe: () => apiClient.get<User>('/auth/me'),
    getUsers: () => apiClient.get<User[]>('/auth/users'),
  },

  // Dashboard
  dashboard: {
    getStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
    getAlerts: () => apiClient.get<any>('/dashboard/alerts'),
  },

  // Customers & Customer 360
  customers: {
    list: (params?: Record<string, any>) => apiClient.get<Customer[]>('/customers', { params }),
    getById: (id: string) => apiClient.get<Customer>(`/customers/${id}`),
    get360: (id: string) => apiClient.get<any>(`/customers/${id}/360`),
    create: (data: Partial<Customer>) => apiClient.post<Customer>('/customers', data),
    update: (id: string, data: Partial<Customer>) => apiClient.put<Customer>(`/customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/customers/${id}`),
    addNote: (id: string, note: string) => apiClient.post(`/customers/${id}/notes`, { note }),
  },

  // Follow-ups
  followUps: {
    list: (params?: Record<string, any>) => apiClient.get<FollowUp[]>('/followups', { params }),
    create: (data: Partial<FollowUp>) => apiClient.post<FollowUp>('/followups', data),
    updateStatus: (id: string, data: { status: string; notes?: string; rescheduledDate?: string }) =>
      apiClient.patch<FollowUp>(`/followups/${id}/status`, data),
    delete: (id: string) => apiClient.delete(`/followups/${id}`),
  },

  // Products & Inventory Health
  products: {
    list: (params?: Record<string, any>) => apiClient.get<Product[]>('/products', { params }),
    getById: (id: string) => apiClient.get<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => apiClient.post<Product>('/products', data),
    update: (id: string, data: Partial<Product>) => apiClient.put<Product>(`/products/${id}`, data),
    delete: (id: string) => apiClient.delete(`/products/${id}`),
    getCategories: () => apiClient.get<Category[]>('/products/categories'),
    getWarehouses: () => apiClient.get<Warehouse[]>('/products/warehouses'),
  },

  // Stock Movement Ledger
  inventory: {
    getMovements: (params?: Record<string, any>) =>
      apiClient.get<StockMovement[]>('/inventory/movements', { params }),
    adjustStock: (data: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      movementType: 'IN' | 'OUT';
      reason: string;
      referenceNumber?: string;
      notes: string;
    }) => apiClient.post('/inventory/adjust', data),
  },

  // Sales Challans
  challans: {
    list: (params?: Record<string, any>) => apiClient.get<SalesChallan[]>('/challans', { params }),
    getById: (id: string) => apiClient.get<SalesChallan>(`/challans/${id}`),
    previewStock: (items: { productId: string; quantity: number; unitPrice?: number }[]) =>
      apiClient.post<any>('/challans/preview-stock', { items }),
    create: (data: any) => apiClient.post<SalesChallan>('/challans', data),
    confirm: (id: string) => apiClient.post<SalesChallan>(`/challans/${id}/confirm`),
    cancel: (id: string, reason: string) => apiClient.post<SalesChallan>(`/challans/${id}/cancel`, { reason }),
  },

  // Global Search
  search: {
    query: (q: string) => apiClient.get<any>('/search', { params: { q } }),
  },

  // Audit Logs
  audit: {
    list: (params?: Record<string, any>) => apiClient.get<AuditLogItem[]>('/audit-logs', { params }),
  },

  // Notifications
  notifications: {
    list: () => apiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    markAllRead: () => apiClient.post('/notifications/read-all'),
  },

  // Settings
  settings: {
    get: () => apiClient.get<any>('/settings'),
  },
};
