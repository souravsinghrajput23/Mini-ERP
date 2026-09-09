import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/endpoints';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Skeleton } from '../../components/common/Skeleton';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  Users,
  CalendarClock,
  Boxes,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
  Package,
  Clock,
  FileText,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { formatCurrency, formatCompactNumber, formatRelativeTime } from '../../utils/formatters';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
  });

  const { data: alertsData, isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.dashboard.getAlerts(),
  });

  const stats = (statsData as any)?.data;
  const alerts = (alertsData as any)?.data?.alerts || [];
  const recentActivities = (alertsData as any)?.data?.recentActivities || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Operations Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time operations, inventory valuation, stock movements, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/stock-movements')}
            leftIcon={<Boxes className="w-4 h-4 text-emerald-400" />}
          >
            Stock Ledger
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/challans/create')}
            leftIcon={<FileCheck2 className="w-4 h-4" />}
          >
            New Sales Challan
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.kpis.totalRevenue.value)}
            icon={<IndianRupee className="w-5 h-5" />}
            color="emerald"
            change={{
              value: stats.kpis.totalRevenue.growthPercentage,
              isPositive: stats.kpis.totalRevenue.growthPercentage >= 0,
              label: 'growth',
            }}
            onClick={() => navigate('/challans')}
          />

          <StatCard
            title="Total Customers"
            value={stats.kpis.totalCustomers.value}
            icon={<Users className="w-5 h-5" />}
            color="indigo"
            change={{
              value: `+${stats.kpis.totalCustomers.growth} new`,
              isPositive: stats.kpis.totalCustomers.growth > 0,
            }}
            onClick={() => navigate('/customers')}
          />

          <StatCard
            title="Pending Follow-ups"
            value={stats.kpis.pendingFollowUps.value}
            icon={<CalendarClock className="w-5 h-5" />}
            color="amber"
            subtitle={`${stats.kpis.pendingFollowUps.overdue} overdue items`}
            onClick={() => navigate('/followups')}
          />

          <StatCard
            title="Inventory Valuation"
            value={formatCurrency(stats.kpis.inventoryValuation.value)}
            icon={<Boxes className="w-5 h-5" />}
            color="purple"
            subtitle={`${stats.kpis.inventoryValuation.catalogCount} active SKUs`}
            onClick={() => navigate('/inventory')}
          />

          <StatCard
            title="Low Stock Alert"
            value={stats.kpis.lowStockProducts.value}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="rose"
            subtitle={`${stats.kpis.lowStockProducts.criticalCount} critical SKUs`}
            onClick={() => navigate('/inventory?filter=critical')}
          />

          <StatCard
            title="Challans This Month"
            value={stats.kpis.challansThisMonth.value}
            icon={<FileCheck2 className="w-5 h-5" />}
            color="blue"
            change={{
              value: stats.kpis.challansThisMonth.comparisonWithPrevMonth >= 0 ? `+${stats.kpis.challansThisMonth.comparisonWithPrevMonth}` : `${stats.kpis.challansThisMonth.comparisonWithPrevMonth}`,
              isPositive: stats.kpis.challansThisMonth.comparisonWithPrevMonth >= 0,
              label: 'vs last mo',
            }}
            onClick={() => navigate('/challans')}
          />
        </div>
      ) : null}

      {/* Attention Required Smart Alerts */}
      <Card className="border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">Attention Required</CardTitle>
              <CardDescription>
                High-priority action triggers requiring operational intervention.
              </CardDescription>
            </div>
          </div>
          <Badge variant="amber" size="md">
            {alerts.length} Active Triggers
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {isAlertsLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              🟢 All operations healthy. No urgent alerts or overdue tasks detected.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl shrink-0 mt-0.5 bg-slate-800 border border-slate-700">
                      {alert.type === 'LOW_STOCK' && <Package className="w-4 h-4 text-rose-400" />}
                      {alert.type === 'OVERDUE_FOLLOWUP' && <Clock className="w-4 h-4 text-amber-400" />}
                      {alert.type === 'DRAFT_CHALLAN' && <FileText className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                          {alert.title}
                        </h4>
                        <Badge
                          variant={
                            alert.severity === 'CRITICAL'
                              ? 'rose'
                              : alert.severity === 'WARNING'
                              ? 'amber'
                              : 'indigo'
                          }
                          size="sm"
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(alert.link)}
                    className="shrink-0 self-end sm:self-center text-xs"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    {alert.actionLabel}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Charts Grid */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend Revenue & Volume Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Monthly Revenue & Volume Trend
                </CardTitle>
                <CardDescription>
                  Confirmed sales challans revenue over the past 6 billing cycles
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.charts.salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `₹${formatCompactNumber(v)}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                      formatter={(val: any) => [formatCurrency(val), 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Customer Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Segments</CardTitle>
              <CardDescription>Distribution by client business category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.charts.customerDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {stats.charts.customerDistribution.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                {stats.charts.customerDistribution.map((c: any, index: number) => (
                  <div key={c.type} className="p-2 rounded-xl bg-slate-800/40">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-[10px] font-bold text-slate-300 truncate">{c.type}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-100 font-mono">{c.count}</div>
                    <div className="text-[10px] text-slate-500">{c.percentage}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lower Row: Top Selling Products & Recent Activity */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Products */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Performing Products</CardTitle>
                <CardDescription>Highest volume and revenue contributors</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/inventory')}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                View Catalog
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/80">
                {stats.charts.topSellingProducts.map((p: any, index: number) => (
                  <div
                    key={p.id}
                    className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center border border-slate-700">
                        #{index + 1}
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-semibold text-slate-200">
                          {p.name}
                        </h5>
                        <span className="text-[11px] font-mono text-slate-400">{p.sku}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-bold text-slate-100 font-mono">
                        {formatCurrency(p.totalRevenue)}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium">
                        {p.quantity} units dispatched
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Audit & System Operations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Audit Trail</CardTitle>
                <CardDescription>Recent immutable ledger activity</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/audit-logs')}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                All Logs
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800/80">
                {recentActivities.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3.5 sm:px-5 flex items-start gap-3">
                    <img
                      src={
                        log.user?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(log.userName || 'System')}&background=6366f1&color=fff`
                      }
                      alt={log.userName}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-200 truncate">
                          {log.userName}
                        </span>
                        <Badge variant="slate" size="sm">
                          {log.action}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {log.entity} • ID: {log.entityId?.slice(0, 8)}...
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
