import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { Customer, CustomerType, CustomerStatus } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Drawer } from '../../components/common/Drawer';
import { EmptyState } from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Users,
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Edit2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const CustomerList: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  // Drawer state for Add/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    mobile: '',
    email: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    status: 'ACTIVE' as CustomerStatus,
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['customers', search, customerType, status, page],
    queryFn: () =>
      api.customers.list({
        search: search || undefined,
        customerType: customerType !== 'ALL' ? customerType : undefined,
        status: status !== 'ALL' ? status : undefined,
        page,
        limit: 10,
      }),
  });

  const customers: Customer[] = (responseData as any)?.data || [];
  const meta = (responseData as any)?.meta || { total: 0, totalPages: 1 };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Customer>) => api.customers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success('Customer registered', 'Customer record created successfully.');
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showError('Failed to save customer', err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      api.customers.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success('Customer updated', 'Customer details saved.');
      setIsDrawerOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      showError('Failed to update customer', err.message);
    },
  });

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      businessName: '',
      mobile: '',
      email: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      status: 'ACTIVE',
      address: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      businessName: customer.businessName,
      mobile: customer.mobile,
      email: customer.email || '',
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      status: customer.status,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode || '',
      notes: customer.notes || '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            CRM & Customer Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Directory of wholesale distributors, retail accounts, GST profiles and follow-up schedules.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Customer
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search company, contact person, mobile, GSTIN or city..."
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
              value={customerType}
              onChange={(e) => {
                setCustomerType(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Customer Types' },
                { value: 'WHOLESALE', label: 'Wholesale' },
                { value: 'DISTRIBUTOR', label: 'Distributor' },
                { value: 'RETAIL', label: 'Retail' },
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'LEAD', label: 'Lead / Inactive' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Customer Cards & Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8 text-indigo-400" />}
          title="No Customers Found"
          description="Try adjusting your search or category filters to find matching customer records."
          actionLabel="Register First Customer"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate(`/customers/${c.id}`)}
              className="p-4 sm:p-5 hover:border-slate-700/80 cursor-pointer transition-all hover:bg-slate-900/80 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info Left */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-base shrink-0 group-hover:scale-105 transition-transform">
                    {c.businessName.charAt(0)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {c.businessName}
                      </h3>
                      <Badge
                        variant={
                          c.customerType === 'WHOLESALE'
                            ? 'indigo'
                            : c.customerType === 'DISTRIBUTOR'
                            ? 'purple'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {c.customerType}
                      </Badge>
                      <Badge
                        variant={c.status === 'ACTIVE' ? 'emerald' : c.status === 'LEAD' ? 'amber' : 'rose'}
                        size="sm"
                        dot
                      >
                        {c.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        {c.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {c.mobile}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          {c.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {c.city}, {c.state}
                      </span>
                    </div>

                    {c.gstNumber && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950/60 text-[11px] font-mono text-slate-400 border border-slate-800">
                        GSTIN: {c.gstNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Metrics & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {c._count?.salesChallans || 0}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Challans
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        {c._count?.followUps || 0}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Follow-ups
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenEdit(c, e)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/customers/${c.id}`)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      360 View
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
                <span className="font-bold text-slate-200">{meta.totalPages}</span> ({meta.total} customers)
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

      {/* Customer Create / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.businessName}` : 'Register New Customer'}
        description="Fill in business and GST registration details for wholesale operations."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Registered Business / Entity Name *"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            placeholder="e.g. Bharat Heavy Equipments Pvt Ltd"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rajesh Agrawal"
              required
            />
            <Input
              label="Primary Mobile Number *"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="e.g. +91 98201 45678"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. procure@bharatheavy.com"
            />
            <Input
              label="GSTIN (15 Digits)"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. 27AABCB1234F1Z5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Customer Type *"
              value={formData.customerType}
              onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
              options={[
                { value: 'WHOLESALE', label: 'Wholesale' },
                { value: 'DISTRIBUTOR', label: 'Distributor' },
                { value: 'RETAIL', label: 'Retail' },
              ]}
            />
            <Select
              label="CRM Status *"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'LEAD', label: 'Lead' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>

          <Input
            label="Delivery / Factory Address *"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. Plot 45, MIDC Industrial Area, Turbhe"
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City *"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Navi Mumbai"
              required
            />
            <Input
              label="State *"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="Maharashtra"
              required
            />
            <Input
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              placeholder="400705"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">Operational Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Credit terms, special packaging instructions, dispatch gate details..."
              rows={3}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
