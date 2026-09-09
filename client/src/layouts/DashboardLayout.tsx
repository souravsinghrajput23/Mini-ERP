import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar';
import { TopNav } from '../components/navigation/TopNav';
import { CommandPalette } from '../components/command/CommandPalette';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export const DashboardLayout: React.FC = () => {
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Top Header */}
        <TopNav />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
};
