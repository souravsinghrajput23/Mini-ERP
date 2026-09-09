import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { SalesChallan } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { generateChallanPDF } from '../../utils/pdfGenerator';
import {
  FileText,
  Download,
  Printer,
  Share2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Building2,
  Truck,
  Boxes,
  ShieldCheck,
  AlertCircle,
  Copy,
  Info,
  Calendar,
} from 'lucide-react';
import { formatCurrency, formatCurrencyDetailed, formatDate, formatDateTime } from '../../utils/formatters';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const { hasRole } = useAuth();

  // Dialog states
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['challan-detail', id],
    queryFn: () => api.challans.getById(id!),
    enabled: !!id,
  });

  const challan: SalesChallan = (responseData as any)?.data;

  // Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: () => api.challans.confirm(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      success('Challan Confirmed! 📦', 'Inventory stock automatically deducted from warehouse.');
      setIsConfirmDialogOpen(false);
    },
    onError: (err: any) => {
      showError('Confirmation failed', err.message);
      setIsConfirmDialogOpen(false);
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) => api.challans.cancel(id!, reason),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['challan-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

      success('Challan Cancelled', res.message || 'Challan marked as cancelled and stock restored.');
      setIsCancelModalOpen(false);
    },
    onError: (err: any) => {
      showError('Cancellation failed', err.message);
    },
  });

  const handleDownload = () => {
    if (challan) generateChallanPDF(challan, 'download');
  };

  const handlePrint = () => {
    if (challan) generateChallanPDF(challan, 'print');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    success('Link copied', 'Challan direct link copied to clipboard.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!challan) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-bold text-slate-200">Challan record not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/challans')}>
          Back to Challans List
        </Button>
      </div>
    );
  }

  const isConfirmed = challan.status === 'CONFIRMED';
  const isDraft = challan.status === 'DRAFT';
  const isCancelled = challan.status === 'CANCELLED';

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/challans')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight">
                {challan.challanNumber}
              </h2>
              <Badge
                variant={isConfirmed ? 'emerald' : isDraft ? 'amber' : 'rose'}
                size="md"
                dot
              >
                {challan.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Issued on {formatDateTime(challan.createdAt)} • Prepared by {challan.createdBy?.name}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            leftIcon={<Download className="w-4 h-4 text-indigo-400" />}
          >
            Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4 text-slate-400" />}
          >
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            leftIcon={<Share2 className="w-4 h-4 text-slate-400" />}
          >
            Share
          </Button>

          {/* Conditional Workflow Buttons */}
          {isDraft && hasRole('ADMIN', 'SALES') && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setIsConfirmDialogOpen(true)}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Deduct Stock
            </Button>
          )}

          {!isCancelled && hasRole('ADMIN', 'SALES', 'ACCOUNTS') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setCancellationReason('');
                setIsCancelModalOpen(true);
              }}
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              Cancel Challan
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {isConfirmed && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Official Confirmed Delivery Challan</span>
              <p className="text-emerald-300/80 mt-0.5">
                Confirmed by {challan.confirmedBy?.name || 'Administrator'} on{' '}
                {formatDateTime(challan.confirmedAt)}. Inventory stock was deducted atomically.
              </p>
            </div>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Draft Delivery Challan</span>
              <p className="text-amber-300/80 mt-0.5">
                This challan is currently in Draft state. Warehouse inventory has NOT been deducted yet.
              </p>
            </div>
          </div>
          {hasRole('ADMIN', 'SALES') && (
            <Button
              variant="success"
              size="sm"
              onClick={() => setIsConfirmDialogOpen(true)}
              className="shrink-0 text-xs"
            >
              Confirm Now
            </Button>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold">Challan Cancelled</span>
            <p className="text-rose-300/80 mt-0.5">
              Cancelled on {formatDateTime(challan.cancelledAt)}. Reason: "{challan.cancellationReason || 'No reason specified'}". Any deducted stock was automatically restored.
            </p>
          </div>
        </div>
      )}

      {/* Consignee & Logistics Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer / Consignee */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Consignee Details
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/customers/${challan.customer.id}`)}
              className="text-indigo-400 text-xs h-7"
            >
              Customer 360 →
            </Button>
          </div>

          <div className="text-xs space-y-2">
            <div className="text-sm font-bold text-slate-100">{challan.customer.businessName}</div>
            <div className="text-slate-300">Attn: {challan.customer.name} • {challan.customer.mobile}</div>
            <div className="text-slate-400">
              GSTIN: <strong className="text-indigo-400 font-mono">{challan.customer.gstNumber || 'Unregistered'}</strong>
            </div>
            <div className="text-slate-400">
              Address: {challan.customer.address}, {challan.customer.city}, {challan.customer.state} {challan.customer.pincode}
            </div>
          </div>
        </Card>

        {/* Logistics & Transporter */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Logistics & Dispatch
            </span>
            <Badge variant="slate" size="sm">
              Original Consignment
            </Badge>
          </div>

          <div className="text-xs space-y-2">
            <div>
              <span className="text-slate-500">Transporter:</span>{' '}
              <strong className="text-slate-200">{challan.dispatchThrough || 'Self / Direct Carrier'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Vehicle Number:</span>{' '}
              <strong className="text-slate-200 font-mono">{challan.vehicleNumber || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Dispatch Notes:</span>{' '}
              <span className="text-slate-300">{challan.notes || 'None'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Historical Snapshot Items Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              Itemized Consignment Table
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Product Snapshot Active: Historical pricing and naming are frozen for audit integrity.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">#</th>
                  <th className="px-4 py-3">SKU Snapshot</th>
                  <th className="px-4 py-3">Product Name (Snapshot)</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Rate</th>
                  <th className="px-5 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {challan.items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{index + 1}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-300">
                      {item.skuSnapshot}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-100">
                      {item.productNameSnapshot}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-200">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-300">
                      {formatCurrencyDetailed(item.unitPriceSnapshot)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-100">
                      {formatCurrencyDetailed(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation Bar */}
          <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-xs text-slate-400 max-w-sm">
              <span className="font-bold text-slate-300">Standard Terms:</span>
              <p className="mt-1 text-[11px] text-slate-500 leading-relaxed whitespace-pre-line font-mono">
                {challan.terms || 'Goods once dispatched are non-returnable.'}
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-200">{formatCurrencyDetailed(challan.subTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Integrated GST ({challan.taxRate}%):</span>
                <span className="font-mono font-bold text-slate-200">{formatCurrencyDetailed(challan.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Units:</span>
                <span className="font-mono font-bold text-slate-200">{challan.totalQuantity} Units</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm font-bold text-slate-100">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-base">{formatCurrencyDetailed(challan.grandTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => confirmMutation.mutate()}
        title={`Confirm Sales Challan #${challan.challanNumber}`}
        message="This operation will atomically reduce inventory stock for all line items from their respective warehouses. Are you ready to confirm?"
        confirmText="Yes, Confirm & Deduct Stock"
        variant="success"
        isLoading={confirmMutation.isPending}
      />

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={`Cancel Sales Challan #${challan.challanNumber}`}
        description="Cancelling a confirmed challan will safely restore all deducted stock back into the warehouse."
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Mandatory Cancellation Justification *
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Client requested postponement, or transport cancellation..."
              rows={3}
              required
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={cancellationReason.trim().length < 3}
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancellationReason)}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share / Email Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Sales Challan"
        description={`Challan #${challan.challanNumber} for ${challan.customer.businessName}`}
        size="sm"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Direct Web Portal Link:</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 font-mono text-[11px]"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink} leftIcon={<Copy className="w-3.5 h-3.5" />}>
                Copy
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200">Instant PDF Delivery</span>
            <p className="text-slate-400">
              Download the official delivery challan PDF or click print for physical dispatch attachment.
            </p>
          </div>

          <div className="pt-3 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
              Download PDF Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
