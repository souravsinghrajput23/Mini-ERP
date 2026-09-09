import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { StockMovement, MovementType, MovementReason } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ArrowLeftRight,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Warehouse,
  FileText,
  User,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';

export const StockLedger: React.FC = () => {
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('ALL');
  const [reason, setReason] = useState('ALL');
  const [warehouseId, setWarehouseId] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['stock-movements', search, movementType, reason, warehouseId, page],
    queryFn: () =>
      api.inventory.getMovements({
        search: search || undefined,
        movementType: movementType !== 'ALL' ? movementType : undefined,
        reason: reason !== 'ALL' ? reason : undefined,
        warehouseId: warehouseId !== 'ALL' ? warehouseId : undefined,
        page,
        limit: 15,
      }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.products.getWarehouses(),
  });

  const movements: StockMovement[] = (responseData as any)?.data || [];
  const meta = (responseData as any)?.meta || { total: 0, totalPages: 1 };
  const warehouses = (warehousesData as any)?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
            Stock Movement Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete immutable audit log of every stock intake, sales dispatch, and inventory adjustment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Search reference number, SKU, product or note..."
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
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Directions (IN & OUT)' },
                { value: 'IN', label: '🟢 IN (+ Inward / Receipt)' },
                { value: 'OUT', label: '🔴 OUT (- Sales / Dispatch)' },
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Movement Reasons' },
                { value: 'SALES_CHALLAN', label: 'Sales Challan Dispatch' },
                { value: 'PURCHASE_RECEIVED', label: 'Purchase Inward Received' },
                { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment' },
                { value: 'STOCK_RETURN', label: 'Customer Stock Return' },
                { value: 'DAMAGED_WRITE_OFF', label: 'Damaged Write-Off' },
              ]}
            />
          </div>

          <div className="sm:col-span-2">
            <Select
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Hubs</option>
              {warehouses.map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Table or Timeline View */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <EmptyState
          icon={<ArrowLeftRight className="w-8 h-8 text-indigo-400" />}
          title="No Movement Records"
          description="No stock intake or dispatch transactions match the current filter criteria."
        />
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Warehouse</th>
                  <th className="px-4 py-3 text-center">Direction</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-5 py-3">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                      <div>{formatDate(m.createdAt)}</div>
                      <div className="text-[10px] text-slate-500">{formatRelativeTime(m.createdAt)}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{m.product.name}</div>
                      <span className="font-mono text-[11px] text-slate-400">{m.product.sku}</span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800">
                        {m.warehouse.code}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={m.movementType === 'IN' ? 'emerald' : 'rose'} size="sm" dot>
                        {m.movementType}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                      <span className={m.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.movementType === 'IN' ? '+' : '-'}
                        {m.quantity} {m.product.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-slate-300 font-medium text-xs">
                        {m.reason.replace(/_/g, ' ')}
                      </span>
                      {m.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                          {m.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-indigo-400 whitespace-nowrap">
                      {m.referenceNumber || '—'}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            m.createdBy.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.createdBy.name)}&background=6366f1&color=fff`
                          }
                          alt={m.createdBy.name}
                          className="w-6 h-6 rounded-lg object-cover border border-slate-700"
                        />
                        <span className="text-xs text-slate-300">{m.createdBy.name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page <span className="font-bold text-slate-200">{meta.page}</span> of{' '}
                <span className="font-bold text-slate-200">{meta.totalPages}</span> ({meta.total} movements)
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
        </Card>
      ) : (
        /* Visual Movement Timeline */
        <Card className="p-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {movements.map((m) => (
              <div key={m.id} className="relative group">
                <div
                  className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-slate-900 ring-2 ${
                    m.movementType === 'IN'
                      ? 'bg-emerald-500 ring-emerald-500/30'
                      : 'bg-rose-500 ring-rose-500/30'
                  }`}
                />

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all group-hover:bg-slate-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{m.product.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">({m.product.sku})</span>
                      <Badge variant={m.movementType === 'IN' ? 'emerald' : 'rose'} size="sm">
                        {m.movementType === 'IN' ? '+' : '-'}
                        {m.quantity} {m.product.unit}
                      </Badge>
                    </div>

                    <span className="text-xs font-mono text-slate-500">
                      {formatDateTime(m.createdAt)} ({formatRelativeTime(m.createdAt)})
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span>
                      Reason: <strong className="text-slate-300">{m.reason.replace(/_/g, ' ')}</strong>
                    </span>
                    {m.referenceNumber && (
                      <span>
                        Ref: <strong className="text-indigo-400 font-mono">{m.referenceNumber}</strong>
                      </span>
                    )}
                    <span>
                      Hub: <strong className="text-slate-300">{m.warehouse.name}</strong>
                    </span>
                    <span>
                      Recorded by: <strong className="text-slate-300">{m.createdBy.name}</strong>
                    </span>
                  </div>

                  {m.notes && (
                    <p className="text-xs text-slate-400 mt-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80 italic">
                      "{m.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
