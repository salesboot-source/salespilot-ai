'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: DashboardIcon },
  { href: '/prospect-discovery', label: 'Prospect Discovery', icon: DiscoveryIcon, starred: true },
  { href: '/research', label: 'AI Intelligence', icon: AIIcon },
  { href: '/companies', label: 'Workspace', icon: CompaniesIcon },
  { href: '/pricing', label: 'Pricing', icon: PricingIcon },
  { href: '/company-profile', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full flex-col w-[240px] bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <span className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">SalesPilot</span>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--accent-subtle)] text-indigo-300 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]'
              }`}
            >
              <Icon active={isActive} />
              {item.label}
              {'starred' in item && item.starred && (
                <span className="ml-auto text-[10px] text-amber-400">★</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-colors">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[11px] font-semibold text-white">
            {user?.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{user?.full_name}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-1 text-left text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors px-4 py-1.5 rounded-lg hover:bg-white/[0.03]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

// SVG Icons
function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <rect x="1" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function DiscoveryIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 5v4M5 7h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function AIIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function CompaniesIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function PricingIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <rect x="2" y="4" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-indigo-400' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1v2M8 13v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
