'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TopNavbar from '../components/TopNavbar';
import { History, Search, Calendar, Package, RefreshCw } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function LogsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkUser();
    fetchLogs();
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, [filter]);

  const checkUser = () => {
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!userId) { router.push('/login'); return; }
    setUser({ id: userId, role: userRole, username });
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('distribution_points').select('*').eq('status', 'sold').order('sold_at', { ascending: false });
      
      if (filter === 'today') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        query = query.gte('sold_at', today.toISOString());
      } else if (filter === 'week') {
        const week = new Date(); week.setDate(week.getDate() - 7);
        query = query.gte('sold_at', week.toISOString());
      } else if (filter === 'month') {
        const month = new Date(); month.setMonth(month.getMonth() - 1);
        query = query.gte('sold_at', month.toISOString());
      }

      const { data } = await query;
      setLogs(data || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.clear(); document.cookie = 'user_token=; path=/; max-age=0'; document.cookie = 'user_role=; path=/; max-age=0'; router.push('/login'); };
  const getProductDisplay = (p) => p.product_type === 'أخرى' ? (p.product_value || 'غير محدد') : p.product_type;

  const filteredLogs = logs.filter(p => getProductDisplay(p).toLowerCase().includes(searchQuery.toLowerCase()));

  const todayCount = logs.filter(l => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(l.sold_at) >= today;
  }).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-900' : 'bg-orange-100'}`}><History className={darkMode ? 'text-orange-400' : 'text-orange-600'} size={28} /></div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>سجل المبيعات</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{logs.length} عملية بيع • {todayCount} اليوم</p>
            </div>
          </div>
          <button onClick={fetchLogs} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow`}><RefreshCw size={20} /></button>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث..." className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[{ k: 'all', l: 'الكل' }, { k: 'today', l: 'اليوم' }, { k: 'week', l: 'الأسبوع' }, { k: 'month', l: 'الشهر' }].map(f => (
                <button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 rounded-xl font-medium ${filter === f.k ? 'bg-orange-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{f.l}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" /></div>
        ) : filteredLogs.length === 0 ? (
          <div className={`text-center py-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg`}>
            <Package className="mx-auto mb-4 text-gray-300" size={64} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد مبيعات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogs.map(log => (
              <div key={log.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
                <img src={log.image_url} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getProductDisplay(log)}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={16} />
                    <span>{new Date(log.sold_at).toLocaleString('ar-SA')}</span>
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
