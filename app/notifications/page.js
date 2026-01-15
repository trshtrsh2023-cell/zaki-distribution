'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNavbar from '../components/TopNavbar';
import { Bell, Check, Trash2, CheckCheck, Package, Users, MapPin, Info } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    checkUser();
    loadNotifications();
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, []);

  const checkUser = () => {
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!userId) { router.push('/login'); return; }
    setUser({ id: userId, role: userRole, username });
  };

  const loadNotifications = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) setNotifications(JSON.parse(stored));
  };

  const handleLogout = () => { localStorage.clear(); document.cookie = 'user_token=; path=/; max-age=0'; document.cookie = 'user_role=; path=/; max-age=0'; router.push('/login'); };

  const markAsRead = (index) => {
    const updated = [...notifications];
    updated[index].read = true;
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const deleteNotification = (index) => {
    const updated = notifications.filter((_, i) => i !== index);
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    if (confirm('حذف الكل؟')) {
      setNotifications([]);
      localStorage.setItem('notifications', '[]');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_product': return <Package className="text-blue-500" size={20} />;
      case 'product_sold': return <CheckCheck className="text-green-500" size={20} />;
      case 'user_added': return <Users className="text-purple-500" size={20} />;
      default: return <Info className="text-gray-500" size={20} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl relative ${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
              <Bell className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} size={28} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{unreadCount}</span>}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>الإشعارات</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notifications.length} إشعار • {unreadCount} غير مقروء</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={markAllAsRead} disabled={unreadCount === 0} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${unreadCount === 0 ? 'opacity-50' : ''} ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700 shadow'}`}><CheckCheck size={18} /> قراءة الكل</button>
            <button onClick={clearAll} disabled={notifications.length === 0} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${notifications.length === 0 ? 'opacity-50' : ''} ${darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-600'}`}><Trash2 size={18} /> حذف الكل</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[{ key: 'all', label: 'الكل' }, { key: 'unread', label: 'غير مقروء' }, { key: 'read', label: 'مقروء' }].map(item => (
            <button key={item.key} onClick={() => setFilter(item.key)} className={`px-4 py-2 rounded-xl font-medium ${filter === item.key ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600 shadow'}`}>
              {item.label} {item.key === 'unread' && unreadCount > 0 && <span className="mr-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className={`text-center py-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg`}>
            <Bell className="mx-auto mb-4 text-gray-300" size={64} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif, index) => (
              <div key={index} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 ${!notif.read ? (darkMode ? 'border-r-4 border-blue-500' : 'border-r-4 border-blue-500 bg-blue-50/50') : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{notif.message}</p>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.time}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notif.read && <button onClick={() => markAsRead(index)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-green-50 text-green-600'}`}><Check size={18} /></button>}
                    <button onClick={() => deleteNotification(index)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
