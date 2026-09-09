import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import {
  Settings,
  Building2,
  Warehouse,
  FolderTree,
  Database,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Role } from '../../types';

export const SettingsPage: React.FC = () => {
  const { switchDemoRole } = useAuth();
  const { success } = useNotification();

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.settings.get(),
  });

  const settings = (responseData as any)?.data;

  const handleRoleSwitch = async (role: Role) => {
    await switchDemoRole(role);
    success(`Role switched`, `Switched active session to ${role}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          System Setup & Master Configuration
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Company legal profile, multi-warehouse fulfillment logistics hubs, product categories, and demo evaluation personas.
        </p>
      </div>

      {/* Company Legal Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Company & Tax Profile
          </CardTitle>
          <CardDescription>
            Registered legal entity details appearing on printed delivery challans and tax invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Company Name:</span>
              <span className="text-sm font-bold text-slate-100 mt-0.5 block">
                {settings?.company?.NAME || 'FlowLedger Technologies India Pvt Ltd'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">GSTIN Registration:</span>
              <span className="text-sm font-mono font-bold text-indigo-400 mt-0.5 block">
                {settings?.company?.GST || '27AABCU9603R1ZM'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Registered Office:</span>
              <span className="text-slate-200 mt-0.5 block">
                {settings?.company?.ADDRESS || 'Gurugram, Haryana'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Contact Phone:</span>
              <span className="text-slate-200 mt-0.5 block">
                {settings?.company?.PHONE || '+91 124 489 7700'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Official Email:</span>
              <span className="text-slate-200 mt-0.5 block">
                {settings?.company?.EMAIL || 'operations@flowledger.io'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warehouses & Fulfillment Hubs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-emerald-400" />
            Fulfillment Centers & Warehouses
          </CardTitle>
          <CardDescription>
            Multi-location inventory storage nodes with physical capacity and manager contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/80">
            {settings?.warehouses?.map((wh: any) => (
              <div
                key={wh.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-100">{wh.name}</h4>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                      {wh.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wh.address}, {wh.city}, {wh.state}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                    <span>Contact: {wh.contactPerson || 'Logistics Lead'}</span>
                    <span>Phone: {wh.contactPhone || '—'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    {wh._count?.products || 0} SKUs Stocked
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Capacity: {wh.capacity.toLocaleString('en-IN')} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-400" />
            Master Product Categories
          </CardTitle>
          <CardDescription>
            High-level classification hierarchy for wholesale inventory.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/80">
            {settings?.categories?.map((cat: any) => (
              <div
                key={cat.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-200">{cat.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {cat.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{cat.description}</p>
                </div>
                <div className="text-xs font-mono font-bold text-indigo-400 shrink-0">
                  {cat._count?.products || 0} Products
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Credentials & RBAC Switcher */}
      <Card className="border-indigo-500/30 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-indigo-300">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Evaluation Credentials & Demo Personas
          </CardTitle>
          <CardDescription>
            Click any persona below to instantaneously evaluate role-based access control (RBAC).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(DEMO_CREDENTIALS) as Role[]).map((role) => {
              const cred = DEMO_CREDENTIALS[role];
              return (
                <div
                  key={role}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="indigo" size="sm">
                        {role}
                      </Badge>
                    </div>
                    <div className="text-sm font-bold text-slate-100">{cred.name}</div>
                    <div className="text-xs text-slate-400">{cred.title}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">{cred.email}</div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleSwitch(role)}
                    className="w-full text-xs mt-3"
                  >
                    Switch to {role}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
