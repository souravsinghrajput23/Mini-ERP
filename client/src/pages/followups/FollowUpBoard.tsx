import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { FollowUp, Priority, FollowUpStatus } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Building2,
  User,
  Calendar,
  Phone,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { formatDate, isOverdue } from '../../utils/formatters';

export const FollowUpBoard: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeframe, setTimeframe] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    rescheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [createData, setCreateData] = useState({
    customerId: '',
    assignedToId: '',
    reason: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM' as Priority,
    notes: '',
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['followups', search, priorityFilter, statusFilter, timeframe],
    queryFn: () =>
      api.followUps.list({
        search: search || undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        timeframe: timeframe !== 'all' ? timeframe : undefined,
      }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => api.customers.list({ limit: 100 }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.auth.getUsers(),
  });

  const followUps: FollowUp[] = (responseData as any)?.data || [];
  const customers = (customersData as any)?.data || [];
  const users = (usersData as any)?.data || [];

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.followUps.updateStatus(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
      success('Status updated', `Follow-up marked as ${vars.data.status.toLowerCase()}.`);
      setIsRescheduleModalOpen(false);
    },
    onError: (err: any) => showError('Action failed', err.message),
  });

  // Create follow-up mutation
  const createMutation = useMutation({
    mutationFn: (dto: any) => api.followUps.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Follow-up created', 'New scheduled task registered.');
      setIsCreateModalOpen(false);
      setCreateData({
        customerId: '',
        assignedToId: '',
        reason: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM',
        notes: '',
      });
    },
    onError: (err: any) => showError('Creation failed', err.message),
  });

  const handleComplete = (f: FollowUp) => {
    statusMutation.mutate({
      id: f.id,
      data: { status: 'COMPLETED', notes: 'Completed by agent action.' },
    });
  };

  const handleOpenReschedule = (f: FollowUp) => {
    setSelectedFollowUp(f);
    setRescheduleData({
      rescheduledDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    statusMutation.mutate({
      id: selectedFollowUp.id,
      data: {
        status: 'RESCHEDULED',
        rescheduledDate: rescheduleData.rescheduledDate,
        notes: rescheduleData.notes,
      },
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.customerId) {
      showError('Please select a customer.');
      return;
    }
    createMutation.mutate({
      ...createData,
      assignedToId: createData.assignedToId || users[0]?.id,
    });
  };

  // Grouping for board display
  const overdueItems = followUps.filter(
    (f) => f.status === 'PENDING' && isOverdue(f.dueDate)
  );
  const todayItems = followUps.filter((f) => {
    const d = new Date(f.dueDate);
    const now = new Date();
    return (
      f.status === 'PENDING' &&
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
  const upcomingItems = followUps.filter(
    (f) => f.status === 'PENDING' && !isOverdue(f.dueDate) && !todayItems.includes(f)
  );
  const completedItems = followUps.filter((f) => f.status === 'COMPLETED');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-indigo-400" />
            Smart Follow-up System
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prioritized customer communications, reminders, and automatic overdue alerting.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Follow-up
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Search by reason, customer, or business..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'HIGH', label: 'High Priority' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'LOW', label: 'Low Priority' },
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'RESCHEDULED', label: 'Rescheduled' },
              ]}
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-1">
            <button
              onClick={() => setTimeframe(timeframe === 'overdue' ? 'all' : 'overdue')}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                timeframe === 'overdue'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Overdue ({overdueItems.length})
            </button>
          </div>
        </div>
      </Card>

      {/* Kanban / Multi-Column Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-2xl" />
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-8 h-8 text-indigo-400" />}
          title="No Follow-up Tasks"
          description="All scheduled touchpoints have been completed or no matching tasks found."
          actionLabel="Schedule Follow-up"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Overdue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Actions
              </span>
              <Badge variant="rose" size="sm">
                {overdueItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {overdueItems.map((f) => (
                <FollowUpCard
                  key={f.id}
                  followUp={f}
                  onComplete={() => handleComplete(f)}
                  onReschedule={() => handleOpenReschedule(f)}
                  onViewCustomer={() => navigate(`/customers/${f.customer.id}`)}
                />
              ))}
              {overdueItems.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                  No overdue follow-ups. Great job!
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Today */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Today's Schedule
              </span>
              <Badge variant="amber" size="sm">
                {todayItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {todayItems.map((f) => (
                <FollowUpCard
                  key={f.id}
                  followUp={f}
                  onComplete={() => handleComplete(f)}
                  onReschedule={() => handleOpenReschedule(f)}
                  onViewCustomer={() => navigate(`/customers/${f.customer.id}`)}
                />
              ))}
              {todayItems.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                  No pending follow-ups due today.
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Upcoming & Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Pipeline
              </span>
              <Badge variant="indigo" size="sm">
                {upcomingItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {upcomingItems.map((f) => (
                <FollowUpCard
                  key={f.id}
                  followUp={f}
                  onComplete={() => handleComplete(f)}
                  onReschedule={() => handleOpenReschedule(f)}
                  onViewCustomer={() => navigate(`/customers/${f.customer.id}`)}
                />
              ))}
              {upcomingItems.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                  No upcoming follow-ups scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Follow-up"
        description={selectedFollowUp?.customer?.businessName}
        size="sm"
      >
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <Input
            label="New Due Date *"
            type="date"
            value={rescheduleData.rescheduledDate}
            onChange={(e) =>
              setRescheduleData({ ...rescheduleData, rescheduledDate: e.target.value })
            }
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Reason for Rescheduling
            </label>
            <textarea
              value={rescheduleData.notes}
              onChange={(e) =>
                setRescheduleData({ ...rescheduleData, notes: e.target.value })
              }
              placeholder="e.g. Client requested callback on Tuesday morning..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={statusMutation.isPending}
            >
              Save New Date
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Follow-up Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Schedule CRM Follow-up"
        description="Assign a priority follow-up task to a team member."
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Target Customer *"
            value={createData.customerId}
            onChange={(e) => setCreateData({ ...createData, customerId: e.target.value })}
            required
          >
            <option value="">-- Choose Customer --</option>
            {customers.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.businessName} ({c.name} - {c.city})
              </option>
            ))}
          </Select>

          <Input
            label="Agenda / Purpose *"
            value={createData.reason}
            onChange={(e) => setCreateData({ ...createData, reason: e.target.value })}
            placeholder="e.g. Quotation review for 500m Polycab cable"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date *"
              type="date"
              value={createData.dueDate}
              onChange={(e) => setCreateData({ ...createData, dueDate: e.target.value })}
              required
            />
            <Select
              label="Priority Level *"
              value={createData.priority}
              onChange={(e) =>
                setCreateData({ ...createData, priority: e.target.value as Priority })
              }
              options={[
                { value: 'HIGH', label: 'High Priority (Urgent)' },
                { value: 'MEDIUM', label: 'Medium Priority' },
                { value: 'LOW', label: 'Low Priority' },
              ]}
            />
          </div>

          <Select
            label="Assigned Team Member *"
            value={createData.assignedToId}
            onChange={(e) => setCreateData({ ...createData, assignedToId: e.target.value })}
          >
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role} - {u.department})
              </option>
            ))}
          </Select>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Notes / Instructions</label>
            <textarea
              value={createData.notes}
              onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
              placeholder="Key talking points or special attachments..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending}
            >
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Follow-up card helper component
const FollowUpCard: React.FC<{
  followUp: FollowUp;
  onComplete: () => void;
  onReschedule: () => void;
  onViewCustomer: () => void;
}> = ({ followUp, onComplete, onReschedule, onViewCustomer }) => {
  return (
    <Card className="p-4 hover:border-slate-700 transition-all bg-slate-900/90 shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="cursor-pointer group" onClick={onViewCustomer}>
          <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
            {followUp.customer.businessName}
          </h4>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {followUp.customer.name} ({followUp.customer.city})
          </span>
        </div>

        <Badge
          variant={
            followUp.priority === 'HIGH'
              ? 'rose'
              : followUp.priority === 'MEDIUM'
              ? 'amber'
              : 'slate'
          }
          size="sm"
        >
          {followUp.priority}
        </Badge>
      </div>

      <p className="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
        {followUp.reason}
      </p>

      {followUp.notes && (
        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
          Note: {followUp.notes}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          {formatDate(followUp.dueDate)}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-slate-500" />
          {followUp.assignedTo.name}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onReschedule}
          className="text-[11px] h-7 px-2.5"
          leftIcon={<RotateCcw className="w-3 h-3" />}
        >
          Reschedule
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={onComplete}
          className="text-[11px] h-7 px-2.5"
          leftIcon={<CheckCircle2 className="w-3 h-3" />}
        >
          Complete
        </Button>
      </div>
    </Card>
  );
};
