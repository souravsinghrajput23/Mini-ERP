import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { Role } from '../../types';

export const TopNav: React.FC = () => {
  const { user, logout, switchDemoRole } = useAuth();
  const { setMobileSidebarOpen, openCommandPalette } = useUI();
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumb title
  const path = location.pathname;
  let pageTitle = 'Dashboard';
  if (path.startsWith('/customers/')) pageTitle = 'Customer 360';
  else if (path === '/customers') pageTitle = 'CRM Customers';
  else if (path === '/followups') pageTitle = 'Smart Follow-ups';
  else if (path === '/inventory') pageTitle = 'Product Catalog & Health';
  else if (path === '/stock-movements') pageTitle = 'Stock Movement Ledger';
  else if (path === '/challans/create') pageTitle = 'Create Sales Challan';
  else if (path.startsWith('/challans/')) pageTitle = 'Sales Challan View';
  else if (path === '/challans') pageTitle = 'Sales Challans';
  else if (path === '/audit-logs') pageTitle = 'Admin Audit Activity';
  else if (path === '/settings') pageTitle = 'System Settings';

  const handleRoleSelect = async (role: Role) => {
    setIsRoleMenuOpen(false);
    await switchDemoRole(role);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile menu toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">FlowLedger</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-sm font-bold text-slate-100">{pageTitle}</h1>
        </div>
      </div>

      {/* Center: Global Search Command Palette Button */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all shadow-inner group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            <span>Search customers, SKUs, challans...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
              Ctrl+K
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-slate-700">
              /
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Role Switcher, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={openCommandPalette}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Quick Demo Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all"
            title="Switch Demo Role"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Role: {user?.role}</span>
            <span className="sm:hidden">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {isRoleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsRoleMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-slide-up space-y-1">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Demo Persona
                </div>
                {(Object.keys(DEMO_CREDENTIALS) as Role[]).map((roleKey) => {
                  const cred = DEMO_CREDENTIALS[roleKey];
                  const isCurrent = user?.role === roleKey;
                  return (
                    <button
                      key={roleKey}
                      onClick={() => handleRoleSelect(roleKey)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{cred.name}</div>
                        <div className="text-[10px] text-slate-400">{cred.title}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {roleKey}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Notifications Bell */}
        <NotificationDropdown />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/80 transition-all"
          >
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff`
              }
              alt={user?.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-700"
            />
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-slide-up">
                <div className="p-3 border-b border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-100">{user?.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  <div className="text-[10px] text-indigo-400 font-semibold mt-1">
                    {user?.department || 'Operations Team'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>System Setup & Warehouses</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
