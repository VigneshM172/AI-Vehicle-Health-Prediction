import React from 'react';
import {
  LayoutDashboard,
  HeartPulse,
  Component,
  Gauge,
  History,
  Bell,
  Settings,
  Car,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

export type AppView =
  | 'dashboard'
  | 'vehicle-health'
  | 'components'
  | 'telemetry'
  | 'history'
  | 'alerts'
  | 'settings';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'vehicle-health', label: 'Vehicle Health', icon: <HeartPulse className="w-[18px] h-[18px]" /> },
  { id: 'components', label: 'Component Health', icon: <Component className="w-[18px] h-[18px]" /> },
  { id: 'telemetry', label: 'Live Telemetry', icon: <Gauge className="w-[18px] h-[18px]" /> },
  { id: 'history', label: 'Prediction History', icon: <History className="w-[18px] h-[18px]" /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell className="w-[18px] h-[18px]" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
];

interface SidebarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
  alertCount = 0,
}) => {
  const handleNav = (view: AppView) => {
    onNavigate(view);
    onMobileClose();
  };

  const sidebarContent = (
    <aside
      className={`flex flex-col h-full bg-[#0d1219] border-r border-slate-800/80 transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]'
      }`}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[var(--topbar-height)] border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/20 shrink-0">
          <Car className="w-[18px] h-[18px] text-blue-400" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">Vehicle Health</p>
            <p className="text-[11px] text-slate-500 truncate">Monitoring Dashboard</p>
          </div>
        )}
        {/* Mobile close */}
        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto lg:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" role="navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/15 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-blue-400' : ''}`}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.id === 'alerts' && alertCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {alertCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block p-3 border-t border-slate-800/80 shrink-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0 h-screen sticky top-0">{sidebarContent}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="sidebar-overlay lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-2xl">{sidebarContent}</div>
        </>
      )}
    </>
  );
};

export const VIEW_TITLES: Record<AppView, string> = {
  dashboard: 'Dashboard',
  'vehicle-health': 'Vehicle Health',
  components: 'Component Health',
  telemetry: 'Live Telemetry',
  history: 'Prediction History',
  alerts: 'Alerts',
  settings: 'Settings',
};
