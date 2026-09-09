import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  Package,
  FileCheck2,
  Clock,
  Send,
  PlusCircle,
  Plus,
  ArrowLeft,
  Layers,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';

export const Customer360: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();

  const [newNote, setNewNote] = useState('');
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    reason: '',
    dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    priority: 'MEDIUM',
    notes: '',
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['customer-360', id],
    queryFn: () => api.customers.get360(id!),
    enabled: !!id,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.auth.getUsers(),
  });

  const users = (usersData as any)?.data || [];

  const c360 = (responseData as any)?.data;
  const customer = c360?.customer;
  const metrics = c360?.metrics;
  const timeline = c360?.timeline || [];
  const nextFollowUp = c360?.nextFollowUp;

  // Add Note mutation
  const noteMutation = useMutation({
    mutationFn: (noteText: string) => api.customers.addNote(id!, noteText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-360', id] });
      success('Note added', 'Note saved to customer activity history.');
      setNewNote('');
    },
    onError: (err: any) => showError('Failed to add note', err.message),
  });

  // Create FollowUp mutation
  const followUpMutation = useMutation({
    mutationFn: (dto: any) =>
      api.followUps.create({
        ...dto,
        customerId: id,
        assignedToId: users[0]?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-360', id] });
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      success('Follow-up scheduled', 'New CRM follow-up created.');
      setIsFollowUpModalOpen(false);
      setFollowUpData({
        reason: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        notes: '',
      });
    },
    onError: (err: any) => showError('Failed to schedule follow-up', err.message),
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    noteMutation.mutate(newNote);
  };

  const handleScheduleFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpData.reason.trim()) return;
    followUpMutation.mutate(followUpData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center p-12">
        <h3 className="text-lg font-bold text-slate-200">Customer record not found</h3>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/customers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/customers')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
                {customer.businessName}
              </h2>
              <Badge variant="indigo" size="sm">
                {customer.customerType}
              </Badge>
              <Badge variant={customer.status === 'ACTIVE' ? 'emerald' : 'amber'} size="sm" dot>
                {customer.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer ID: <span className="font-mono">{customer.id}</span> • Attn: {customer.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFollowUpModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4 text-amber-400" />}
          >
            Schedule Follow-up
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/challans/create?customerId=${customer.id}`)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Challan
          </Button>
        </div>
      </div>

      {/* Financial & Order Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-indigo-500/20 bg-indigo-950/20">
          <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
            Lifetime Revenue
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono mt-2">
            {formatCurrency(metrics.totalSpend)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Confirmed billing</div>
        </Card>

        <Card className="p-4 border-emerald-500/20 bg-emerald-950/20">
          <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
            Total Orders
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono mt-2">
            {metrics.totalOrders}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {metrics.confirmedOrders} confirmed
          </div>
        </Card>

        <Card className="p-4 border-amber-500/20 bg-amber-950/20">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            Total Units
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono mt-2">
            {metrics.totalQuantityPurchased}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Units dispatched</div>
        </Card>

        <Card className="p-4 border-purple-500/20 bg-purple-950/20">
          <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
            Avg Order Value
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-100 font-mono mt-2">
            {formatCurrency(metrics.averageOrderValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Per sales challan</div>
        </Card>
      </div>

      {/* Main Grid: Customer Details + Next Action on Left, Unified Visual Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contact info & Next Followup */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contact Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Entity & GST Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div>
                <span className="text-slate-500 block">Contact Person</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{customer.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Mobile Phone</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{customer.mobile}</span>
              </div>
              {customer.email && (
                <div>
                  <span className="text-slate-500 block">Email Address</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">{customer.email}</span>
                </div>
              )}
              {customer.gstNumber && (
                <div>
                  <span className="text-slate-500 block">GSTIN Registration</span>
                  <span className="font-mono font-bold text-indigo-400 mt-0.5 block">
                    {customer.gstNumber}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500 block">Billing & Delivery Address</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  {customer.address}, {customer.city}, {customer.state} {customer.pincode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Follow-up Card */}
          <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                <Clock className="w-4 h-4" />
                Next CRM Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextFollowUp ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{formatDate(nextFollowUp.dueDate)}</span>
                    <Badge variant={nextFollowUp.priority === 'HIGH' ? 'rose' : 'amber'} size="sm">
                      {nextFollowUp.priority} Priority
                    </Badge>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-medium">{nextFollowUp.reason}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span>Assigned: {nextFollowUp.assignedTo?.name || 'Sales Rep'}</span>
                    <span className="text-indigo-400">{nextFollowUp.status}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 text-center py-3">
                  No upcoming follow-up scheduled.
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => setIsFollowUpModalOpen(true)}
                  >
                    Schedule Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Add Note Box */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Quick Log Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer discussion, credit agreement, or special request..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  isLoading={noteMutation.isPending}
                  disabled={!newNote.trim()}
                  rightIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Post Note
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Unified Visual Activity Timeline & Challans Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Customer 360 Visual Activity Timeline
              </CardTitle>
              <CardDescription>
                Chronological ledger of registrations, follow-ups, challan issuances, and notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {timeline.map((item: any) => (
                  <div key={item.id} className="relative group">
                    {/* Circle Node on line */}
                    <div
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-slate-900 ring-2 ${
                        item.badgeColor === 'emerald'
                          ? 'bg-emerald-500 ring-emerald-500/30'
                          : item.badgeColor === 'indigo'
                          ? 'bg-indigo-500 ring-indigo-500/30'
                          : item.badgeColor === 'blue'
                          ? 'bg-blue-500 ring-blue-500/30'
                          : item.badgeColor === 'purple'
                          ? 'bg-purple-500 ring-purple-500/30'
                          : item.badgeColor === 'amber'
                          ? 'bg-amber-500 ring-amber-500/30'
                          : 'bg-slate-500 ring-slate-500/30'
                      }`}
                    />

                    <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all group-hover:bg-slate-800/70">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{item.title}</span>
                          <span className="text-[10px] text-slate-400">by {item.actor}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {formatDateTime(item.timestamp)} ({formatRelativeTime(item.timestamp)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                      {item.meta?.challanId && (
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/challans/${item.meta.challanId}`)}
                            className="text-[11px] h-7 px-2 text-indigo-400 hover:text-indigo-300"
                          >
                            View Challan Details →
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sales Challans History Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  Purchase & Challan History
                </CardTitle>
                <CardDescription>
                  All delivery challans issued to {customer.businessName}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customer.salesChallans?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No sales challans recorded for this client.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3">Challan No</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Items</th>
                        <th className="px-4 py-3 text-right">Grand Total</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {customer.salesChallans.map((ch: any) => (
                        <tr
                          key={ch.id}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/challans/${ch.id}`)}
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-100">
                            {ch.challanNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">{formatDate(ch.createdAt)}</td>
                          <td className="px-4 py-3.5 text-right font-mono">{ch.totalQuantity}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-100">
                            {formatCurrency(ch.grandTotal)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
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
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/challans/${ch.id}`);
                              }}
                              className="text-indigo-400 text-[11px]"
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title={`Schedule Follow-up: ${customer.businessName}`}
        description="Set agenda, due date, and priority for next customer touchpoint."
        size="md"
      >
        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <Input
            label="Follow-up Reason / Agenda *"
            value={followUpData.reason}
            onChange={(e) => setFollowUpData({ ...followUpData, reason: e.target.value })}
            placeholder="e.g. Contract renewal negotiation or dispatch confirmation"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date *"
              type="date"
              value={followUpData.dueDate}
              onChange={(e) => setFollowUpData({ ...followUpData, dueDate: e.target.value })}
              required
            />
            <Select
              label="Priority *"
              value={followUpData.priority}
              onChange={(e) => setFollowUpData({ ...followUpData, priority: e.target.value })}
              options={[
                { value: 'HIGH', label: 'High Priority (Urgent)' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'LOW', label: 'Low Priority' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Additional Notes</label>
            <textarea
              value={followUpData.notes}
              onChange={(e) => setFollowUpData({ ...followUpData, notes: e.target.value })}
              placeholder="Preparation items, sample parts to carry..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={followUpMutation.isPending}
            >
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
