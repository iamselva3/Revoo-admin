import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Tag,
  Inbox,
  HelpCircle,
  ShieldAlert,
  LogOut,
  UserCheck,
  Layers,
  Image,
  Receipt,
  Flame,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/requests', label: 'Buyback Requests', icon: Inbox },
    { to: '/employees', label: 'Employee Management', icon: Users },
    { to: '/catalogue', label: 'Selling Models (Buyback)', icon: Smartphone },
    { to: '/buy-inventory', label: 'Buy Phones (Certified Store)', icon: ShoppingBag },
    { to: '/pricing', label: 'Pricing Engine', icon: Tag },
    { to: '/banners', label: 'Banners & Offers', icon: Image },
    { to: '/popups', label: 'App Launch Popup', icon: Flame },
    { to: '/invoices', label: 'Invoices & Orders', icon: Receipt },
    { to: '/enquiries', label: 'Customer Support', icon: HelpCircle },
    { to: '/audits', label: 'Audit Trail', icon: ShieldAlert },
  ];

  /*
   * The sidebar is intentionally dark in BOTH themes. index.css force-overrides several
   * slate utilities under `html.dark` with !important (bg-white, bg-slate-50/100/200/900/950,
   * border-slate-100/200/300/800, text-slate-400…900, hover:bg-slate-800). The sidebar
   * therefore only uses classes outside that list (brand `bg-genie-dark`, white/black alpha
   * tints, text-slate-200/300, amber accents, and an arbitrary slate-400 hex for icons) so it
   * renders identically in light and dark mode.
   */
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-genie-dark text-white flex flex-col flex-shrink-0 border-r border-white/10">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-white/10 select-none">
          <img
            src="/genie_emblem.png"
            alt="Genie"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="h-9 w-auto shrink-0 object-contain select-none pointer-events-none"
          />
          <div className="leading-tight">
            <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-purple-400 to-pink-500">
              Genie
            </span>
            <span className="text-[10px] block font-medium uppercase tracking-widest text-pink-400">
              Operations Hub
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={item.label}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                    isActive
                      ? 'bg-amber-400/[0.12] text-amber-300 font-semibold'
                      : 'text-slate-300 font-medium hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* 3px left accent bar for the active route */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-amber-400 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-amber-300' : 'text-[#94a3b8] group-hover:text-slate-200'
                      }`}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-revoo-accent font-bold text-xs border border-white/10">
              {admin?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{admin?.fullName}</p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded bg-white/10 text-slate-300">
                {admin?.role}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#94a3b8] hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-black border-b border-slate-200 dark:border-neutral-900 flex items-center justify-between px-8 flex-shrink-0 shadow-sm dark:shadow-none transition-colors duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 bg-green-50 dark:bg-emerald-950/40 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-800/50 rounded-full inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              API Online
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium hidden sm:inline-block">
              System Date: <strong className="text-slate-700 dark:text-neutral-200">{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
            <span aria-hidden="true" className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-neutral-800" />
            <ThemeToggle showLabel />
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-black transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

