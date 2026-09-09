export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED';

export type StockHealthStatus = 'HEALTHY' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
export type MovementType = 'IN' | 'OUT';
export type MovementReason =
  | 'PURCHASE_RECEIVED'
  | 'SALES_CHALLAN'
  | 'MANUAL_ADJUSTMENT'
  | 'STOCK_RETURN'
  | 'DAMAGED_WRITE_OFF';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    salesChallans: number;
    followUps: number;
    customerNotes: number;
  };
}

export interface CustomerNote {
  id: string;
  customerId: string;
  authorId: string;
  note: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface FollowUp {
  id: string;
  customerId: string;
  assignedToId: string;
  reason: string;
  dueDate: string;
  priority: Priority;
  status: FollowUpStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email?: string;
    city: string;
    customerType: CustomerType;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: Role;
  };
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: string;
  _count?: { products: number };
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  contactPerson?: string;
  contactPhone?: string;
  capacity: number;
  createdAt?: string;
  _count?: { products: number; stockMovements: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitPrice: number;
  currentStock: number;
  minStockQuantity: number;
  warehouseId: string;
  unit: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  warehouse?: Warehouse;
  inventoryHealth: {
    status: StockHealthStatus;
    color: string;
    label: string;
  };
  valuation?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  movementType: MovementType;
  reason: MovementReason;
  referenceNumber?: string;
  challanId?: string;
  createdById: string;
  notes?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    unitPrice: number;
  };
  warehouse: {
    id: string;
    name: string;
    code: string;
    city: string;
  };
  createdBy: {
    id: string;
    name: string;
    role: Role;
    avatar?: string;
  };
  challan?: {
    id: string;
    challanNumber: string;
    status: ChallanStatus;
  };
}

export interface SalesChallanItem {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    currentStock: number;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  status: ChallanStatus;
  totalQuantity: number;
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  dispatchThrough?: string;
  vehicleNumber?: string;
  createdById: string;
  confirmedById?: string;
  confirmedAt?: string;
  cancelledById?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  createdBy: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    department?: string;
  };
  confirmedBy?: {
    id: string;
    name: string;
    email?: string;
  };
  items: SalesChallanItem[];
  stockMovements?: StockMovement[];
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'OVERDUE_FOLLOWUP' | 'CHALLAN_CONFIRMED' | 'STOCK_ALERT' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  detailsJson?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: string;
  };
}

export interface DashboardStats {
  kpis: {
    totalRevenue: { value: number; growthPercentage: number; label: string; currency: string };
    totalCustomers: { value: number; growth: number; label: string };
    pendingFollowUps: { value: number; overdue: number; label: string };
    inventoryValuation: { value: number; catalogCount: number; label: string; currency: string };
    lowStockProducts: { value: number; criticalCount: number; label: string };
    challansThisMonth: { value: number; comparisonWithPrevMonth: number; label: string };
  };
  charts: {
    salesTrend: { month: string; revenue: number; volume: number; orders: number }[];
    customerDistribution: { type: string; count: number; percentage: number }[];
    challanStatusBreakdown: { status: string; count: number; percentage: number }[];
    topSellingProducts: { id: string; name: string; sku: string; quantity: number; totalRevenue: number }[];
    stockMovementSummary: { totalInQty: number; totalOutQty: number; netChange: number };
  };
}
