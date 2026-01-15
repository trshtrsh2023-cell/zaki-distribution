'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TopNavbar from '../components/TopNavbar';
import { CheckCircle, MapPin, Package, RefreshCw, Download, Send, Undo2, ExternalLink, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SellerPage() {
  const router = useRouter();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [user, setUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [lastSoldId, setLastSoldId] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkUser();
    fetchPoints();
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, [filter]);

  const checkUser = () => {
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!userId) { router.push('/login'); return; }
    setUser({ id: userId, role: userRole, username });
  };

  const fetchPoints = async () => {
    setLoading(true);
    try {
      let query = supabase.from('distribution_points').select('*').order('created_at', { ascending: false });
      if (filter === 'active') query = query.eq('status', 'active');
      else if (filter === 'sold') query = query.eq('status', 'sold');
      const { data } = await query;
      setPoints(data || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const getImages = (p) => (p.images?.length ? p.images : [p.image_url]);
  const nextImg = (id, total) => setCurrentImageIndex(p => ({ ...p, [id]: ((p[id] || 0) + 1) % total }));
  const prevImg = (id, total) => setCurrentImageIndex(p => ({ ...p, [id]: ((p[id] || 0) - 1 + total) % total }));

  const handleCopyImage = async (point) => {
    const imgs = getImages(point);
    const url = imgs[currentImageIndex[point.id] || 0];
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      if (navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setCopiedId(point.id);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }
    } catch {}
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getProductDisplay(point)}_${Date.now()}.jpg`;
    link.click();
    setCopiedId(point.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (point) => {
    const name = getProductDisplay(point);
    const msg = `${name}\n${point.location_url || ''}`.trim();
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleMarkAsSold = async (id) => {
    if (!confirm('تأكيد البيع؟')) return;
    try {
      await supabase.from('distribution_points').update({ status: 'sold', sold_at: new Date().toISOString(), sold_by: user?.id }).eq('id', id);
      const point = points.find(p => p.id === id);
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifs.unshift({ type: 'product_sold', message: `تم بيع: ${getProductDisplay(point)}`, time: new Date().toLocaleString('ar-SA'), read: false });
      localStorage.setItem('notifications', JSON.stringify(notifs.slice(0, 50)));
      setLastSoldId(id);
      fetchPoints();
      setTimeout(() => setLastSoldId(null), 30000);
    } catch { alert('خطأ'); }
  };

  const handleUndoSold = async (id) => {
    try {
      await supabase.from('distribution_points').update({ status: 'active', sold_at: null, sold_by: null }).eq('id', id);
      setLastSoldId(null);
      fetchPoints();
    } catch {}
  };

  const handleLogout = () => { localStorage.clear(); document.cookie = 'user_token=; path=/; max-age=0'; document.cookie = 'user_role=; path=/; max-age=0'; router.push('/login'); };
  const getProductDisplay = (p) => p.product_type === 'أخرى' ? (p.product_value || 'غير محدد') : p.product_type;
  const filtered = points.filter(p => getProductDisplay(p).toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto p-4">
        <div className={`rounded-2xl shadow-lg p-4 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث..." className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex gap-2">
              {[{ k: 'active', l: 'متاحة', c: 'green' }, { k: 'sold', l: 'مباعة', c: 'red' }, { k: 'all', l: 'الكل', c: 'blue' }].map(f => (
                <button key={f.k} onClick={() => setFilter(f.k)} className={`px-4 py-2 rounded-xl font-medium ${filter === f.k ? `bg-${f.c}-500 text-white` : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{f.l}</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <Package className="mx-auto mb-4 text-gray-300" size={64} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد نقاط</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(point => {
              const imgs = getImages(point);
              const idx = currentImageIndex[point.id] || 0;
              return (
                <div key={point.id} className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} ${point.status === 'sold' ? 'opacity-75' : ''}`}>
                  <div className="relative h-48">
                    <img src={imgs[idx]} className="w-full h-full object-cover" />
                    {imgs.length > 1 && (
                      <>
                        <button onClick={() => prevImg(point.id, imgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"><ChevronLeft size={20} /></button>
                        <button onClick={() => nextImg(point.id, imgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full"><ChevronRight size={20} /></button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">{imgs.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`} />)}</div>
                      </>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium ${point.status === 'sold' ? 'bg-red-500' : 'bg-green-500'} text-white`}>{point.status === 'sold' ? 'مباع' : 'متاح'}</span>
                  </div>
                  <div className="p-4">
                    <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getProductDisplay(point)}</h3>
                    {point.location_url && <a href={point.location_url} target="_blank" className="flex items-center gap-2 text-blue-600 text-sm mb-4 hover:underline"><MapPin size={16} /> الموقع <ExternalLink size={14} /></a>}
                    {point.status === 'active' ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button onClick={() => handleCopyImage(point)} className={`flex-1 py-2 rounded-xl font-medium flex items-center justify-center gap-2 ${copiedId === point.id ? 'bg-green-100 text-green-700' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{copiedId === point.id ? <><CheckCircle size={18} /> تم</> : <><Download size={18} /> حفظ</>}</button>
                          <button onClick={() => handleSendWhatsApp(point)} className="flex-1 py-2 rounded-xl font-medium bg-green-500 text-white flex items-center justify-center gap-2"><Send size={18} /> إرسال</button>
                        </div>
                        <button onClick={() => handleMarkAsSold(point.id)} className="w-full py-2 rounded-xl font-medium bg-blue-600 text-white flex items-center justify-center gap-2"><CheckCircle size={18} /> تم البيع</button>
                      </div>
                    ) : lastSoldId === point.id && (
                      <button onClick={() => handleUndoSold(point.id)} className="w-full py-2 rounded-xl font-medium bg-orange-500 text-white flex items-center justify-center gap-2"><Undo2 size={18} /> تراجع</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
