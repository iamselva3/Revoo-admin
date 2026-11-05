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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/requests', label: 'Buyback Requests', icon: Inbox },
    { to: '/catalogue', label: 'Phone Catalogue', icon: Smartphone },
    { to: '/pricing', label: 'Pricing Engine', icon: Tag },
    { to: '/banners', label: 'Banners & Offers', icon: Image },
    { to: '/popups', label: 'App Launch Popup', icon: Flame },
    { to: '/invoices', label: 'Invoices & Orders', icon: Receipt },
    { to: '/enquiries', label: 'Customer Support', icon: HelpCircle },
    { to: '/audits', label: 'Audit Trail', icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-950">
          <img
            src="/revoo-logo.png"
            alt="REVOO"
            className="h-9 w-9 object-contain rounded-md bg-white p-0.5"
          />
          <div>
            <span className="font-extrabold text-lg tracking-wider text-white">REVOO</span>
            <span className="text-[10px] block font-medium uppercase tracking-widest text-revoo-accent">
              Operations Hub
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-revoo-700 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-revoo-accent font-bold text-xs border border-slate-700">
              {admin?.fullName.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{admin?.fullName}</p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-400">
                {admin?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              API Online
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-medium">
              System Date: <strong className="text-slate-700">{new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

