'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  CreditCard,
  Settings,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Items', href: '/dashboard/items', icon: Package },
  { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  // Client-only hydration guard: server always renders `false`, client
  // subscribes to nothing and reports `true`, so this flips exactly once
  // after hydration without a setState-in-effect render cascade.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4">
          <h1 className="text-xl font-bold text-gray-900">Nestmart IMAS</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200 flex flex-col gap-4">
          <div className="bg-zinc-950 p-3 rounded-xl flex items-center gap-3 shadow-sm">
            {!mounted || !user ? (
              <div className="flex items-center gap-3 w-full animate-pulse">
                <div className="w-9 h-9 bg-zinc-800 rounded-full shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                  <div className="h-2 bg-zinc-800 rounded w-16" />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-zinc-800 text-zinc-200 w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                  {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-white truncate">
                    {user.username || user.email}
                  </span>
                  <span className="bg-zinc-900 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider w-fit mt-1">
                    {user.role || 'User'}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header can go here */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
