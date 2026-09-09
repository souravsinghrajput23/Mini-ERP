import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { Product, Category, Warehouse } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Drawer } from '../../components/common/Drawer';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Package,
  Search,
  Plus,
  ArrowDownUp,
  Warehouse as WarehouseIcon,
  Tag,
  AlertTriangle,
  Boxes,
  PlusCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';

export const ProductCatalog: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('ALL');
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product Form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    unitPrice: 100,
    currentStock: 50,
    minStockQuantity: 15,
    warehouseId: '',
    unit: 'PCS',
    description: '',
  });

  // Adjust Stock Form state
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    movementType: 'IN' as 'IN' | 'OUT',
    reason: 'PURCHASE_RECEIVED',
    quantity: 10,
    referenceNumber: '',
    notes: '',
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['products', search, categoryId, warehouseId, healthFilter, page],
    queryFn: () =>
      api.products.list({
        search: search || undefined,
        categoryId: categoryId !== 'ALL' ? categoryId : undefined,
        warehouseId: warehouseId !== 'ALL' ? warehouseId : undefined,
        health: healthFilter !== 'ALL' ? healthFilter : undefined,
        page,
        limit: 12,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.products.getCategories(),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.products.getWarehouses(),
  });

  const products: Product[] = (responseData as any)?.data || [];
  const meta = (responseData as any)?.meta || {
    total: 0,
    totalPages: 1,
    totalStockUnits: 0,
    totalCatalogCount: 0,
  };
  const categories: Category[] = (categoriesData as any)?.data || [];
  const warehouses: Warehouse[] = (warehousesData as any)?.data || [];

  // Create Product mutation
  const createProductMutation = useMutation({
    mutationFn: (dto: any) => api.products.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Product Added', 'Product successfully cataloged and initialized.');
      setIsAddProductOpen(false);
    },
    onError: (err: any) => showError('Product creation failed', err.message),
  });

  // Adjust Stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: (dto: any) => api.inventory.adjustStock(dto),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      success('Inventory Updated', res.message || 'Stock updated successfully.');
      setIsAdjustStockOpen(false);
    },
    onError: (err: any) => showError('Stock adjustment failed', err.message),
  });

  const handleOpenAdjust = (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(prod);
    setAdjustForm({
      productId: prod.id,
      movementType: 'IN',
      reason: 'PURCHASE_RECEIVED',
      quantity: 25,
      referenceNumber: `PO-${Date.now().toString().slice(-4)}`,
      notes: `Inward replenishment batch for ${prod.sku}`,
    });
    setIsAdjustStockOpen(true);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.categoryId || !productForm.warehouseId) {
      showError('Please select both a category and warehouse.');
      return;
    }
    createProductMutation.mutate({
      ...productForm,
      unitPrice: Number(productForm.unitPrice),
      currentStock: Number(productForm.currentStock),
      minStockQuantity: Number(productForm.minStockQuantity),
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.productId) return;
    adjustStockMutation.mutate({
      ...adjustForm,
      quantity: Number(adjustForm.quantity),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-indigo-400" />
            Product Catalog & Inventory Health
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time stock ledger, automated minimum threshold warnings, and multi-warehouse allocation.
          </p>
        </div>

        {hasRole('ADMIN', 'WAREHOUSE') && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (products[0]) handleOpenAdjust(products[0], { stopPropagation: () => {} } as any);
              }}
              leftIcon={<ArrowDownUp className="w-4 h-4 text-emerald-400" />}
            >
              Adjust Stock / Inward
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setProductForm({
                  name: '',
                  sku: `SKU-${Date.now().toString().slice(-6)}`,
                  categoryId: categories[0]?.id || '',
                  warehouseId: warehouses[0]?.id || '',
                  unitPrice: 250,
                  currentStock: 100,
                  minStockQuantity: 20,
                  unit: 'PCS',
                  description: '',
                });
                setIsAddProductOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Search product name, SKU, or specs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Select
              value={healthFilter}
              onChange={(e) => {
                setHealthFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Health' },
                { value: 'HEALTHY', label: '🟢 Healthy' },
                { value: 'LOW', label: '🟡 Low Stock' },
                { value: 'CRITICAL', label: '🔴 Critical' },
                { value: 'OUT_OF_STOCK', label: '⚫ Out of Stock' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-indigo-400" />}
          title="No Products Found"
          description="Try changing your search keywords or warehouse filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategoryId('ALL');
            setWarehouseId('ALL');
            setHealthFilter('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isCritical = p.inventoryHealth.status === 'CRITICAL';
            const isOutOfStock = p.inventoryHealth.status === 'OUT_OF_STOCK';
            const isLow = p.inventoryHealth.status === 'LOW';

            return (
              <Card
                key={p.id}
                className="p-5 flex flex-col justify-between hover:border-slate-700/80 transition-all bg-slate-900/90 shadow-md group"
              >
                <div>
                  {/* Top Bar: SKU + Health Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {p.sku}
                    </span>
                    <Badge
                      variant={
                        isOutOfStock
                          ? 'slate'
                          : isCritical
                          ? 'rose'
                          : isLow
                          ? 'amber'
                          : 'emerald'
                      }
                      size="sm"
                      dot
                    >
                      {p.inventoryHealth.label}
                    </Badge>
                  </div>

                  {/* Product Title */}
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {p.name}
                  </h3>

                  {p.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Warehouse & Category Tag */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px]">Location:</span>
                      <span className="font-semibold text-slate-300">
                        {p.warehouse?.code || 'Hub'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[11px]">Unit Rate:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {formatCurrency(p.unitPrice)} / {p.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Level Bar & Action */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-slate-400">Stock on hand:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {p.currentStock} {p.unit}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all rounded-full ${
                        isOutOfStock
                          ? 'bg-slate-600'
                          : isCritical
                          ? 'bg-rose-500'
                          : isLow
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (p.currentStock / Math.max(1, p.minStockQuantity * 2)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500">
                      Min: {p.minStockQuantity} {p.unit}
                    </span>
                    {hasRole('ADMIN', 'WAREHOUSE') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleOpenAdjust(p, e)}
                        className="text-[11px] h-7 px-2"
                      >
                        Adjust / Inward
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Showing page <span className="font-bold text-slate-200">{meta.page}</span> of{' '}
            <span className="font-bold text-slate-200">{meta.totalPages}</span> ({meta.total} products)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Add New Catalog Product"
        description="Register a wholesale item with initial inventory balance and location."
        size="lg"
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-4">
          <Input
            label="Product Name & Specification *"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            placeholder="e.g. SS 316 Hex Bolt M12 x 50mm"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unique SKU Code *"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
              placeholder="SKU-HDW-1001"
              required
            />
            <Select
              label="Category *"
              value={productForm.categoryId}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Unit Selling Price (₹) *"
              type="number"
              value={productForm.unitPrice}
              onChange={(e) => setProductForm({ ...productForm, unitPrice: Number(e.target.value) })}
              min="0.1"
              step="0.01"
              required
            />
            <Input
              label="Initial Stock *"
              type="number"
              value={productForm.currentStock}
              onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })}
              min="0"
              required
            />
            <Input
              label="Min Alert Quantity *"
              type="number"
              value={productForm.minStockQuantity}
              onChange={(e) =>
                setProductForm({ ...productForm, minStockQuantity: Number(e.target.value) })
              }
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Warehouse Location *"
              value={productForm.warehouseId}
              onChange={(e) => setProductForm({ ...productForm, warehouseId: e.target.value })}
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>

            <Select
              label="Measurement Unit *"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
            >
              <option value="PCS">PCS (Pieces)</option>
              <option value="BOX">BOX (Box / Pack)</option>
              <option value="SET">SET (Set / Kit)</option>
              <option value="KG">KG (Kilograms)</option>
              <option value="MTR">MTR (Meters)</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Technical Description</label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Material grade, tensile rating, DIN standards, coating details..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddProductOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createProductMutation.isPending}
            >
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock / Inward Modal */}
      <Modal
        isOpen={isAdjustStockOpen}
        onClose={() => setIsAdjustStockOpen(false)}
        title="Inventory Stock Movement / Inward PO"
        description={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : 'Adjust stock'}
        size="md"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Stock:</span>
            <span className="font-mono font-bold text-slate-100">
              {selectedProduct?.currentStock} {selectedProduct?.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Movement Direction *"
              value={adjustForm.movementType}
              onChange={(e) =>
                setAdjustForm({ ...adjustForm, movementType: e.target.value as 'IN' | 'OUT' })
              }
            >
              <option value="IN">IN (+ Stock Inward / Purchase Receipt)</option>
              <option value="OUT">OUT (- Stock Adjustment / Write-off)</option>
            </Select>

            <Select
              label="Movement Reason *"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            >
              <option value="PURCHASE_RECEIVED">Purchase Received (Inward PO)</option>
              <option value="MANUAL_ADJUSTMENT">Manual Cycle Count Adjustment</option>
              <option value="STOCK_RETURN">Customer Return Re-stock</option>
              <option value="DAMAGED_WRITE_OFF">Damaged / Scrap Write-Off</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity to Move *"
              type="number"
              min="1"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
              required
            />
            <Input
              label="PO / Ref Number"
              value={adjustForm.referenceNumber}
              onChange={(e) => setAdjustForm({ ...adjustForm, referenceNumber: e.target.value })}
              placeholder="e.g. PO-2026-8812"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Audit Note / Justification *
            </label>
            <textarea
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              placeholder="Mandatory explanation for inventory ledger audit..."
              rows={2}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAdjustStockOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={adjustForm.movementType === 'IN' ? 'success' : 'destructive'}
              size="sm"
              type="submit"
              isLoading={adjustStockMutation.isPending}
            >
              Execute Stock {adjustForm.movementType}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
