'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Package, Users, Bell, Map, Moon, Sun, LogOut, Menu, X, Home, History } from 'lucide-react';

export default function TopNavbar({ user, onLogout }) {
  const router = useRouter();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const allPages = [
    { name: 'الرئيسية', path: user?.role === 'owner' ? '/owner' : '/seller', icon: Home, roles: ['owner', 'seller', 'admin'] },
    { name: 'إدارة المستخدمين', path: '/admin/users', icon: Users, roles: ['owner', 'admin'] },
    { name: 'الخريطة', path: '/map', icon: Map, roles: ['owner', 'seller', 'admin'] },
    { name: 'السجلات', path: '/logs', icon: History, roles: ['owner', 'seller', 'admin'] },
    { name: 'الإشعارات', path: '/notifications', icon: Bell, roles: ['owner', 'seller', 'admin'] },
  ];

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) document.documentElement.classList.add('dark');
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) setNotifications(JSON.parse(stored));
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleNavigation = (page) => {
    if (page.roles.includes(user?.role)) router.push(page.path);
    setMobileMenuOpen(false);
  };

  const isCurrentPage = (path) => pathname === path;
  const hasAccess = (page) => page.roles.includes(user?.role);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <Package className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
            </div>
            <div className="hidden sm:block">
              <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>نظام التوزيع</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.username} • {user?.role === 'owner' ? 'مالك' : user?.role === 'admin' ? 'مشرف' : 'بائع'}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {allPages.map((page) => {
              const Icon = page.icon;
              const hasPermission = hasAccess(page);
              const isCurrent = isCurrentPage(page.path);
              return (
                <button key={page.path} onClick={() => handleNavigation(page)} disabled={!hasPermission}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                    ${isCurrent ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      : hasPermission ? darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                      : darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`}>
                  <Icon size={18} />
                  <span className="text-sm">{page.name}</span>
                  {page.path === '/notifications' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                  {!hasPermission && <span className="text-xs opacity-50">🔒</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadCount}</span>}
            </button>
            <button onClick={onLogout}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
              <LogOut size={20} />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className={`absolute left-4 top-16 w-80 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>الإشعارات</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد إشعارات</p>
            ) : (
              notifications.slice(0, 5).map((notif, idx) => (
                <div key={idx} className={`p-3 border-b last:border-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'} ${!notif.read ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') : ''}`}>
                  <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{notif.message}</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.time}</p>
                </div>
              ))
            )}
          </div>
          <button onClick={() => { router.push('/notifications'); setShowNotifications(false); }}
            className={`w-full p-3 text-center text-sm font-medium ${darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-gray-50'}`}>
            عرض الكل
          </button>
        </div>
      )}

      {mobileMenuOpen && (
        <div className={`md:hidden border-t ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="px-4 py-3 space-y-1">
            {allPages.map((page) => {
              const Icon = page.icon;
              const hasPermission = hasAccess(page);
              const isCurrent = isCurrentPage(page.path);
              return (
                <button key={page.path} onClick={() => handleNavigation(page)} disabled={!hasPermission}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                    ${isCurrent ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                      : hasPermission ? darkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                      : darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`}>
                  <Icon size={20} />
                  <span>{page.name}</span>
                  {!hasPermission && <span className="mr-auto text-xs">🔒 غير مصرح</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
