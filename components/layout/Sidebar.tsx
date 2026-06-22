'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard, TrendingUp, Target, Receipt, MessageCircle,
  Download, Settings, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { toggleAIChat, exportData, profile } = useStore();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-[#E8E5E0] transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#F0EDE8]">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-yellow-400 text-base font-black"
          style={{ background: 'linear-gradient(135deg, #1A1A2E, #7B61FF)' }}>
          👑
        </div>
        {!collapsed && (
          <div>
            <div className="font-black text-[#1A1A2E] text-sm leading-tight">CEO Networth</div>
            <div className="text-xs text-[#9CA3AF] leading-tight">{profile?.name || 'Personal'}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#EBF2F0] text-[#5B8A8A]'
                  : 'text-[#6B7280] hover:bg-[#F5F3F0] hover:text-[#2D2D2D]'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-[#F0EDE8] space-y-1">
        <button
          onClick={toggleAIChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#7C9A92] hover:bg-[#EBF2F0] transition-all"
          title={collapsed ? 'AI Assistant' : undefined}
        >
          <MessageCircle size={18} className="shrink-0" />
          {!collapsed && <span>AI Assistant</span>}
        </button>
        <button
          onClick={exportData}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F3F0] hover:text-[#2D2D2D] transition-all"
          title={collapsed ? 'Export Data' : undefined}
        >
          <Download size={18} className="shrink-0" />
          {!collapsed && <span>Export Data</span>}
        </button>
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F5F3F0] hover:text-[#2D2D2D] transition-all',
            pathname === '/settings' && 'bg-[#EBF2F0] text-[#5B8A8A]'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[#E8E5E0] rounded-full flex items-center justify-center shadow-sm hover:bg-[#F0EDE8] text-[#6B7280]"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { toggleAIChat } = useStore();

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E5E0] z-40 flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                active ? 'text-[#7C9A92]' : 'text-[#9CA3AF]'
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={toggleAIChat}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-[#9CA3AF]"
        >
          <MessageCircle size={20} />
          <span>AI</span>
        </button>
      </div>
    </>
  );
}
