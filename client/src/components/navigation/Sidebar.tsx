import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Package,
  ArrowLeftRight,
  FileText,
  ShieldAlert,
  Settings,
  PlusCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUI();

  const navigationItems = [
    {
      name: 'Command Center',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'CRM Customers',
      path: '/customers',
      icon: Users,
      show: hasRole('ADMIN', 'SALES', 'ACCOUNTS'),
    },
    {
      name: 'Smart Follow-ups',
      path: '/followups',
      icon: CalendarClock,
      show: hasRole('ADMIN', 'SALES'),
    },
    {
      name: 'Product Catalog',
      path: '/inventory',
      icon: Package,
      show: true,
    },
    {
      name: 'Stock Ledger',
      path: '/stock-movements',
      icon: ArrowLeftRight,
      show: hasRole('ADMIN', 'WAREHOUSE', 'ACCOUNTS'),
    },
    {
      name: 'Sales Challans',
      path: '/challans',
      icon: FileText,
      show: hasRole('ADMIN', 'SALES', 'ACCOUNTS'),
    },
    {
      name: 'Audit Activity',
      path: '/audit-logs',
      icon: ShieldAlert,
      show: hasRole('ADMIN', 'ACCOUNTS'),
    },
    {
      name: 'Settings & Setup',
      path: '/settings',
      icon: Settings,
      show: hasRole('ADMIN'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
          <NavLink
            to="/dashboard"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-100 tracking-tight">
                  FlowLedger
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[130px]">
                Operations & ERP Portal
              </p>
            </div>
          </NavLink>

          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        {hasRole('ADMIN', 'SALES') && (
          <div className="p-3">
            <NavLink
              to="/challans/create"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Sales Challan</span>
            </NavLink>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigationItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 transition-colors group-hover:text-indigo-400" />
                  <span>{item.name}</span>
                </div>
              </NavLink>
            ))}
        </nav>

        {/* User Card & Demo Persona Switcher */}
        {user && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`
                }
                alt={user.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
              <Badge
                variant={
                  user.role === 'ADMIN'
                    ? 'purple'
                    : user.role === 'SALES'
                    ? 'indigo'
                    : user.role === 'WAREHOUSE'
                    ? 'amber'
                    : 'emerald'
                }
                size="sm"
              >
                {user.role}
              </Badge>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
