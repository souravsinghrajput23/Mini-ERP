import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { Customer, Product } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  Building2,
  Package,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed } from '../../utils/formatters';

interface ChallanDraftItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

export const ChallanCreate: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 4-Step Flow: 1 -> 2 -> 3 -> 4
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get('customerId') || ''
  );
  const [items, setItems] = useState<ChallanDraftItem[]>([]);
  const [dispatchThrough, setDispatchThrough] = useState('V-Trans Express Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('MH-04-GP-8891');
  const [notes, setNotes] = useState('Urgent delivery at factory site. Gate 2 unloading.');
  const [terms, setTerms] = useState(
    '1. Goods once dispatched are non-returnable unless defective.\n2. Payment terms 30 days from challan date.\n3. Subject to Mumbai Jurisdiction.'
  );
  const [taxRate, setTaxRate] = useState(18.0);

  // Fetch Customers & Products
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => api.customers.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => api.products.list({ limit: 200 }),
  });

  const customers: Customer[] = (customersData as any)?.data || [];
  const products: Product[] = (productsData as any)?.data || [];

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Live Stock Preview Calculation
  const previewItems = items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    const available = prod ? prod.currentStock : 0;
    const requested = item.quantity;
    const remaining = available - requested;
    const hasSufficient = requested <= available;
    const shortfall = hasSufficient ? 0 : requested - available;
    const lineTotal = item.unitPrice * requested;

    return {
      ...item,
      product: prod,
      availableStock: available,
      remainingAfterSale: remaining,
      hasSufficientStock: hasSufficient,
      shortfall,
      lineTotal,
    };
  });

  const allStockSufficient =
    previewItems.length > 0 && previewItems.every((i) => i.hasSufficientStock);
  const totalQuantity = previewItems.reduce((sum, i) => sum + i.quantity, 0);
  const subTotal = previewItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount = (subTotal * taxRate) / 100;
  const grandTotal = subTotal + taxAmount;

  // Add Item to list
  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (items.some((i) => i.productId === productId)) {
      showError('Item already added', 'You can modify the quantity directly in the table.');
      return;
    }

    setItems([
      ...items,
      {
        productId: prod.id,
        quantity: Math.min(10, Math.max(1, prod.currentStock > 0 ? prod.currentStock : 1)),
        unitPrice: prod.unitPrice,
        product: prod,
      },
    ]);
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, qty);
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit Challan Mutation
  const createChallanMutation = useMutation({
    mutationFn: (status: 'DRAFT' | 'CONFIRMED') =>
      api.challans.create({
        customerId: selectedCustomerId,
        status,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        dispatchThrough,
        vehicleNumber,
        notes,
        terms,
        taxRate,
      }),
    onSuccess: (res: any, status) => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['customer-360'] });

      if (status === 'CONFIRMED') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        success(
          'Sales Challan Confirmed! 🚀',
          `Challan #${res.data?.challanNumber || ''} confirmed and inventory stock deducted atomically.`
        );
      } else {
        success(
          'Draft Challan Saved',
          `Challan #${res.data?.challanNumber || ''} created as Draft. Inventory untouched.`
        );
      }

      navigate(`/challans/${res.data?.id}`);
    },
    onError: (err: any) => {
      showError('Challan Creation Failed', err.message);
    },
  });

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Step Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Create Sales Challan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-step issuance flow with real-time stock validation and historical product snapshot.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/challans')}>
          Cancel
        </Button>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {[
          { step: 1, title: 'Customer', desc: 'Select recipient' },
          { step: 2, title: 'Products', desc: 'Live Stock Preview' },
          { step: 3, title: 'Dispatch', desc: 'Logistics details' },
          { step: 4, title: 'Confirm', desc: 'Deduction & Review' },
        ].map((s) => (
          <div
            key={s.step}
            onClick={() => {
              if (s.step < currentStep) setCurrentStep(s.step);
            }}
            className={`p-3 rounded-2xl border transition-all ${
              s.step === currentStep
                ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300 shadow-md'
                : s.step < currentStep
                ? 'bg-slate-900 border-slate-800 text-emerald-400 cursor-pointer'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                  s.step === currentStep
                    ? 'bg-indigo-600 text-white'
                    : s.step < currentStep
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {s.step < currentStep ? '✓' : s.step}
              </span>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-tight">{s.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= STEP 1: SELECT CUSTOMER ================= */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-6">
          <CardHeader className="p-0 border-0 mb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Step 1: Select Consignee / Customer
            </CardTitle>
            <CardDescription>
              Choose the wholesale client or distributor receiving this delivery consignment.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <Select
              label="Select Registered Customer *"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="text-sm"
            >
              <option value="">-- Choose Customer from Directory --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} — {c.name} ({c.city}, {c.customerType})
                </option>
              ))}
            </Select>

            {selectedCustomer && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 animate-slide-up">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">
                      {selectedCustomer.businessName}
                    </h4>
                    <Badge variant="indigo" size="sm">
                      {selectedCustomer.customerType}
                    </Badge>
                  </div>
                  <Badge variant="emerald" size="sm" dot>
                    {selectedCustomer.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block">Contact Person:</span>
                    <span className="text-slate-200 font-semibold">{selectedCustomer.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Mobile:</span>
                    <span className="text-slate-200 font-semibold">{selectedCustomer.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GSTIN:</span>
                    <span className="text-indigo-400 font-mono font-bold">
                      {selectedCustomer.gstNumber || 'Unregistered'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block">Delivery Address:</span>
                  <span className="text-slate-300">
                    {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state}{' '}
                    {selectedCustomer.pincode}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end border-t border-slate-800">
            <Button
              variant="primary"
              disabled={!selectedCustomerId}
              onClick={() => setCurrentStep(2)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Add Products & Stock Preview
            </Button>
          </div>
        </Card>
      )}

      {/* ================= STEP 2: ADD PRODUCTS & LIVE STOCK PREVIEW ================= */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 border-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  Step 2: Add Products & Live Stock Preview
                </CardTitle>
                <CardDescription>
                  Real-time stock balance check against available warehouse inventory.
                </CardDescription>
              </div>
            </CardHeader>

            {/* Product Selector Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="flex-1 w-full">
                <Select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    + Click here to select and add a product to this challan...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={items.some((i) => i.productId === p.id)}>
                      {p.name} ({p.sku}) — Available: {p.currentStock} {p.unit} — ₹{p.unitPrice}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Live Stock Preview Table */}
            {items.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30">
                No items added yet. Select a product from the dropdown above to start your challan.
              </div>
            ) : (
              <div className="space-y-4">
                {previewItems.map((item, index) => {
                  const percentLeft = Math.max(
                    0,
                    Math.min(100, ((item.availableStock - item.quantity) / Math.max(1, item.availableStock)) * 100)
                  );

                  return (
                    <div
                      key={item.productId}
                      className={`p-4 rounded-2xl border transition-all ${
                        !item.hasSufficientStock
                          ? 'bg-rose-950/20 border-rose-500/40 glow-border-indigo'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Product Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-100">
                              {item.product?.name}
                            </h4>
                            <span className="font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {item.product?.sku}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Hub: {item.product?.warehouse?.name || 'Central'} • Rate: ₹
                            {item.unitPrice} / {item.product?.unit}
                          </div>
                        </div>

                        {/* Center: Live Stock Visual Preview */}
                        <div className="w-full sm:w-64 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Available Stock:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {item.availableStock} {item.product?.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Requested:</span>
                            <span className="font-mono font-bold text-indigo-400">
                              {item.quantity} {item.product?.unit}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Remaining After Sale:</span>
                            <span
                              className={`font-mono font-bold ${
                                item.hasSufficientStock ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {item.remainingAfterSale} {item.product?.unit}
                            </span>
                          </div>

                          {/* Capacity Bar */}
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.hasSufficientStock ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentLeft}%` }}
                            />
                          </div>
                        </div>

                        {/* Right: Quantity controls & Line Total */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <label className="text-xs text-slate-400">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value, 10))}
                              className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-mono font-bold text-slate-100 text-center focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="text-right min-w-[90px]">
                            <div className="text-sm font-bold text-slate-100 font-mono">
                              {formatCurrency(item.lineTotal)}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Insufficient Stock Warning Alert */}
                      {!item.hasSufficientStock && (
                        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-semibold">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>
                            Insufficient stock — reduce requested quantity by{' '}
                            <strong className="underline font-mono">{item.shortfall} units</strong> to confirm this challan.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Subtotal summary bar */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Total Items: <strong className="text-slate-200">{items.length}</strong> • Total Dispatch Quantity:{' '}
                    <strong className="text-slate-200">{totalQuantity} units</strong>
                  </span>
                  <div className="text-right">
                    <span className="text-slate-400 mr-2">Estimated Subtotal:</span>
                    <strong className="text-base text-slate-100 font-mono">{formatCurrency(subTotal)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 mt-6 flex items-center justify-between border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Customer
              </Button>
              <Button
                variant="primary"
                disabled={items.length === 0}
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Dispatch & Logistics
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ================= STEP 3: DISPATCH & LOGISTICS ================= */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-6">
          <CardHeader className="p-0 border-0 mb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Step 3: Dispatch, Logistics & Terms
            </CardTitle>
            <CardDescription>
              Record transporter details, vehicle license numbers, and delivery instructions.
            </CardDescription>
          </CardHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Transporter / Carrier Agency"
                value={dispatchThrough}
                onChange={(e) => setDispatchThrough(e.target.value)}
                placeholder="e.g. V-Trans Express Logistics"
              />
              <Input
                label="Vehicle / Fleet Registration Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MH-04-GP-8891"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Dispatch Notes / Gate Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Special delivery gate, unloading timing, contact person at site..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Terms & Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Products
            </Button>
            <Button variant="primary" onClick={() => setCurrentStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Review & Confirm
            </Button>
          </div>
        </Card>
      )}

      {/* ================= STEP 4: REVIEW & CONFIRM ================= */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <CardHeader className="p-0 border-0 mb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Step 4: Review Challan & Finalize
            </CardTitle>
            <CardDescription>
              Review product snapshots, GST tax calculations, and choose confirmation or draft status.
            </CardDescription>
          </CardHeader>

          {/* Customer & Logistics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">Consignee</span>
              <div className="font-bold text-slate-100 mt-1">{selectedCustomer?.businessName}</div>
              <div className="text-slate-400">{selectedCustomer?.name} • {selectedCustomer?.mobile}</div>
              <div className="text-slate-400 font-mono mt-0.5">GSTIN: {selectedCustomer?.gstNumber || 'Unregistered'}</div>
            </div>
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold block">Logistics</span>
              <div className="font-semibold text-slate-200 mt-1">Transporter: {dispatchThrough || 'Self'}</div>
              <div className="text-slate-400">Vehicle: {vehicleNumber || 'Pending'}</div>
              <div className="text-slate-400">Delivery: {selectedCustomer?.city}, {selectedCustomer?.state}</div>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Rate</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {previewItems.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3 font-mono font-bold text-slate-300">{item.product?.sku}</td>
                    <td className="px-4 py-3 font-semibold text-slate-100">{item.product?.name}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-indigo-400">
                      {item.quantity} {item.product?.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrencyDetailed(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-100">
                      {formatCurrencyDetailed(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs ml-auto max-w-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-200">{formatCurrencyDetailed(subTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Integrated GST ({taxRate}%):</span>
              <span className="font-mono font-bold text-slate-200">{formatCurrencyDetailed(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Total Units Dispatched:</span>
              <span className="font-mono font-bold text-slate-200">{totalQuantity} Units</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-slate-100">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-400 text-base">{formatCurrencyDetailed(grandTotal)}</span>
            </div>
          </div>

          {/* Insufficient stock banner if any item exceeds available stock */}
          {!allStockSufficient && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1 font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Cannot Confirm Challan: Insufficient warehouse stock detected.</span>
              </div>
              <p className="text-[11px] text-rose-400">
                Please reduce item quantities in Step 2, or click "Save as Draft" to reserve without deducting inventory now.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="md"
                onClick={() => createChallanMutation.mutate('DRAFT')}
                isLoading={createChallanMutation.isPending}
                className="w-full sm:w-auto"
              >
                Save as Draft
              </Button>

              <Button
                variant="success"
                size="md"
                disabled={!allStockSufficient}
                onClick={() => createChallanMutation.mutate('CONFIRMED')}
                isLoading={createChallanMutation.isPending}
                className="w-full sm:w-auto"
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Confirm & Deduct Stock
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
