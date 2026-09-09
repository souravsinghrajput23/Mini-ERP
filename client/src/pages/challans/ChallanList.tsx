import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { SalesChallan, ChallanStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { generateChallanPDF } from '../../utils/pdfGenerator';
import {
  FileText,
  Search,
  Plus,
  Building2,
  Calendar,
  Download,
  Printer,
  ExternalLink,
  Truck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';

export const ChallanList: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['challans', search, statusFilter, page],
    queryFn: () =>
      api.challans.list({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 10,
      }),
  });

  const challans: SalesChallan[] = (responseData as any)?.data || [];
  const meta = (responseData as any)?.meta || { total: 0, totalPages: 1 };

  const handleDownloadPDF = (challan: SalesChallan, e: React.MouseEvent) => {
    e.stopPropagation();
    generateChallanPDF(challan, 'download');
  };

  const handlePrintPDF = (challan: SalesChallan, e: React.MouseEvent) => {
    e.stopPropagation();
    generateChallanPDF(challan, 'print');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Sales Challans & Dispatch Notes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate, track, confirm, and export official delivery challans with atomic stock reduction.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/challans/create')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Sales Challan
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search challan number (e.g. SC-2026-0001), customer, vehicle, or transporter..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>

          <div className="sm:col-span-4">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'CONFIRMED', label: '🟢 Confirmed (Stock Deducted)' },
                { value: 'DRAFT', label: '🟡 Draft (No Stock Deducted)' },
                { value: 'CANCELLED', label: '🔴 Cancelled (Stock Restored)' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Challan Cards List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : challans.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-indigo-400" />}
          title="No Sales Challans Found"
          description="Create your first multi-step delivery challan to dispatch goods."
          actionLabel="Create Sales Challan"
          onAction={() => navigate('/challans/create')}
        />
      ) : (
        <div className="space-y-3">
          {challans.map((ch) => (
            <Card
              key={ch.id}
              onClick={() => navigate(`/challans/${ch.id}`)}
              className="p-4 sm:p-5 hover:border-slate-700/80 cursor-pointer transition-all hover:bg-slate-900/80 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-mono font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {ch.challanNumber}
                      </span>
                      <Badge
                        variant={
                          ch.status === 'CONFIRMED'
                            ? 'emerald'
                            : ch.status === 'DRAFT'
                            ? 'amber'
                            : 'rose'
                        }
                        size="sm"
                        dot
                      >
                        {ch.status}
                      </Badge>
                      <span className="text-xs text-slate-500 font-mono">
                        {formatDate(ch.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-200 mt-1">
                      {ch.customer.businessName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                      <span>Attn: {ch.customer.name}</span>
                      <span>{ch.customer.city}</span>
                      {ch.dispatchThrough && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Truck className="w-3.5 h-3.5 text-slate-500" />
                          {ch.dispatchThrough} {ch.vehicleNumber ? `(${ch.vehicleNumber})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Items, Amount & Action buttons */}
                <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right">
                    <div className="text-base font-bold text-slate-100 font-mono">
                      {formatCurrency(ch.grandTotal)}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {ch.totalQuantity} items • {ch.items?.length || 0} line items
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDownloadPDF(ch, e)}
                      title="Download PDF"
                      className="text-xs"
                      leftIcon={<Download className="w-3.5 h-3.5 text-indigo-400" />}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handlePrintPDF(ch, e)}
                      title="Print Challan"
                      className="text-xs"
                      leftIcon={<Printer className="w-3.5 h-3.5 text-slate-400" />}
                    >
                      Print
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/challans/${ch.id}`)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Showing page <span className="font-bold text-slate-200">{meta.page}</span> of{' '}
                <span className="font-bold text-slate-200">{meta.totalPages}</span> ({meta.total} challans)
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
        </div>
      )}
    </div>
  );
};
