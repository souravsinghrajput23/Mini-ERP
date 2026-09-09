import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { AuditLogItem } from '../../types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  ShieldAlert,
  Search,
  User,
  Activity,
  Layers,
  Code,
  Globe,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';

export const AuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['audit-logs', search, actionFilter, entityFilter, page],
    queryFn: () =>
      api.audit.list({
        search: search || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        entity: entityFilter !== 'ALL' ? entityFilter : undefined,
        page,
        limit: 15,
      }),
  });

  const logs: AuditLogItem[] = (responseData as any)?.data || [];
  const meta = (responseData as any)?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            Audit Activity & Compliance Log
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log of all user logins, customer updates, stock changes, and sales challan confirmations.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <Input
              placeholder="Search user, action, entity ID or details..."
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
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Operations' },
                { value: 'LOGIN', label: 'User Login' },
                { value: 'CUSTOMER_CREATE', label: 'Customer Created' },
                { value: 'CUSTOMER_UPDATE', label: 'Customer Updated' },
                { value: 'PRODUCT_CREATE', label: 'Product Cataloged' },
                { value: 'STOCK_IN', label: 'Stock Inward' },
                { value: 'STOCK_OUT', label: 'Stock Deduction' },
                { value: 'CHALLAN_CREATE', label: 'Challan Generated' },
                { value: 'CHALLAN_CONFIRM', label: 'Challan Confirmed' },
                { value: 'CHALLAN_CANCEL', label: 'Challan Cancelled' },
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Entity Types' },
                { value: 'SalesChallan', label: 'Sales Challans' },
                { value: 'Customer', label: 'Customers' },
                { value: 'Product', label: 'Products' },
                { value: 'StockMovement', label: 'Stock Movements' },
                { value: 'FollowUp', label: 'Follow-ups' },
                { value: 'User', label: 'Users' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Audit Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-indigo-400" />}
          title="No Audit Logs"
          description="No activity entries match your current search filters."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor / User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-5 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400">
                      <div>{formatDate(log.createdAt)}</div>
                      <div className="text-[10px] text-slate-500">{formatRelativeTime(log.createdAt)}</div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            log.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(log.userName || 'User')}&background=6366f1&color=fff`
                          }
                          alt={log.userName || ''}
                          className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-slate-200">{log.userName || 'System'}</div>
                          <div className="text-[10px] text-slate-500">{log.user?.role || 'SYSTEM'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge
                        variant={
                          log.action.includes('CONFIRM') || log.action.includes('IN')
                            ? 'emerald'
                            : log.action.includes('CANCEL') || log.action.includes('DELETE')
                            ? 'rose'
                            : log.action.includes('UPDATE')
                            ? 'amber'
                            : 'indigo'
                        }
                        size="sm"
                      >
                        {log.action}
                      </Badge>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-200 whitespace-nowrap">
                      {log.entity}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.entityId ? `${log.entityId.slice(0, 10)}...` : '—'}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {log.detailsJson ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="text-indigo-400 text-xs h-7 px-2"
                          leftIcon={<Code className="w-3.5 h-3.5" />}
                        >
                          Inspect JSON
                        </Button>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
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
                <span className="font-bold text-slate-200">{meta.totalPages}</span> ({meta.total} records)
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
      )}

      {/* JSON Inspector Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={`Audit Payload: ${selectedLog?.action} on ${selectedLog?.entity}`}
        description={`Logged on ${formatDateTime(selectedLog?.createdAt)} by ${selectedLog?.userName}`}
        size="md"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
              <div>
                <span className="text-slate-500">Entity ID:</span>{' '}
                <span className="text-indigo-300">{selectedLog.entityId || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500">IP:</span>{' '}
                <span className="text-slate-300">{selectedLog.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold block">Structured Payload Diff:</label>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-64">
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedLog.detailsJson || '{}'), null, 2);
                  } catch {
                    return selectedLog.detailsJson;
                  }
                })()}
              </pre>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
