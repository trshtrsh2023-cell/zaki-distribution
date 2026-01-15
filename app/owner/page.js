'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TopNavbar from '../components/TopNavbar';
import { Camera, MapPin, Package, Upload, CheckCircle, RefreshCw, Plus, Image as ImageIcon, X, Link, Navigation, Clipboard, Search } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function OwnerPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [todayProducts, setTodayProducts] = useState([]);
  const [pasteMessage, setPasteMessage] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationOption, setLocationOption] = useState('current');
  const [formData, setFormData] = useState({ product_type: 'نص', product_value: '', images: [], latitude: '', longitude: '', location_url: '' });
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    checkUser();
    getCurrentLocation();
    fetchTodayProducts();
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    const handlePaste = (e) => handlePasteFromClipboard(e);
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const checkUser = () => {
    const userId = localStorage.getItem('user_id');
    const userRole = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    if (!userId || userRole !== 'owner') { router.push('/login'); return; }
    setUser({ id: userId, role: userRole, username });
  };

  const fetchTodayProducts = async () => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data } = await supabase.from('distribution_points').select('*').gte('created_at', today.toISOString()).order('created_at', { ascending: false });
      setTodayProducts(data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude, lng = position.coords.longitude;
        setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString(), location_url: `https://maps.google.com/?q=${lat},${lng}` }));
      });
    }
  };

  const handleLocationOptionChange = (option) => {
    setLocationOption(option);
    if (option === 'current') getCurrentLocation();
    else setFormData(prev => ({ ...prev, latitude: '', longitude: '', location_url: '' }));
  };

  const handleManualLocationChange = (url) => {
    setFormData(prev => ({ ...prev, location_url: url, latitude: '0', longitude: '0' }));
    const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) || url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) setFormData(prev => ({ ...prev, latitude: match[1], longitude: match[2] }));
  };

  const handlePasteFromClipboard = async (e) => {
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `paste_${Date.now()}.png`, { type: blob.type });
          setFormData(prev => ({ ...prev, images: [...prev.images, file] }));
          const reader = new FileReader();
          reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
          reader.readAsDataURL(blob);
          setPasteMessage('تم لصق الصورة ✓');
          setTimeout(() => setPasteMessage(''), 2000);
        }
      }
    }
  };

  const handleManualPaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `paste_${Date.now()}.png`, { type: blob.type });
            setFormData(prev => ({ ...prev, images: [...prev.images, file] }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
            reader.readAsDataURL(blob);
            setPasteMessage('تم لصق الصورة ✓');
            setTimeout(() => setPasteMessage(''), 2000);
            return;
          }
        }
      }
      setPasteMessage('لا توجد صورة'); setTimeout(() => setPasteMessage(''), 2000);
    } catch { setPasteMessage('اضغط Ctrl+V'); setTimeout(() => setPasteMessage(''), 3000); }
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    files.forEach(file => { const reader = new FileReader(); reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]); reader.readAsDataURL(file); });
  };

  const removeImage = (i) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    if (!user) return alert('يجب تسجيل الدخول');
    if (!formData.images.length) return alert('أضف صورة');
    if (!formData.location_url) return alert('أضف الموقع');
    if (formData.product_type === 'أخرى' && !formData.product_value.trim()) return alert('حدد نوع المنتج');

    setLoading(true);
    try {
      const urls = [];
      for (const img of formData.images) {
        const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${img.name.split('.').pop() || 'png'}`;
        await supabase.storage.from('distribution-images').upload(name, img);
        const { data: { publicUrl } } = supabase.storage.from('distribution-images').getPublicUrl(name);
        urls.push(publicUrl);
      }

      await supabase.from('distribution_points').insert({
        product_type: formData.product_type, product_value: formData.product_type === 'أخرى' ? formData.product_value : null,
        latitude: parseFloat(formData.latitude) || 0, longitude: parseFloat(formData.longitude) || 0,
        location_url: formData.location_url, image_url: urls[0], images: urls, status: 'active', created_by: user.id
      });

      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifs.unshift({ type: 'new_product', message: `منتج جديد: ${formData.product_type === 'أخرى' ? formData.product_value : formData.product_type}`, time: new Date().toLocaleString('ar-SA'), read: false });
      localStorage.setItem('notifications', JSON.stringify(notifs.slice(0, 50)));

      setSuccess(true);
      setFormData({ product_type: 'نص', product_value: '', images: [], latitude: formData.latitude, longitude: formData.longitude, location_url: locationOption === 'current' ? formData.location_url : '' });
      setImagePreviews([]);
      fetchTodayProducts();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { alert('خطأ: ' + err.message); }
    setLoading(false);
  };

  const handleLogout = () => { localStorage.clear(); document.cookie = 'user_token=; path=/; max-age=0'; document.cookie = 'user_role=; path=/; max-age=0'; router.push('/login'); };

  const types = ['نص', 'واحد', 'أخرى'];
  const filtered = todayProducts.filter(p => (p.product_type === 'أخرى' ? p.product_value : p.product_type)?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {success && <div className={`rounded-xl p-4 flex items-center gap-3 ${darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-50 text-green-700'}`}><CheckCircle size={24} /> تم الإضافة بنجاح!</div>}

        <div className={`rounded-2xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}><Plus className={darkMode ? 'text-green-400' : 'text-green-600'} size={20} /></div>
            <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>إضافة نقطة توزيع</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>نوع المنتج</label>
              <div className="flex flex-wrap gap-2">
                {types.map(t => (<button key={t} onClick={() => setFormData(p => ({ ...p, product_type: t }))} className={`px-4 py-2 rounded-xl font-medium transition-all ${formData.product_type === t ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>{t}</button>))}
              </div>
            </div>

            {formData.product_type === 'أخرى' && <input type="text" value={formData.product_value} onChange={e => setFormData(p => ({ ...p, product_value: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} placeholder="نوع المنتج..." />}

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الصور</label>
              {pasteMessage && <div className={`mb-3 p-3 rounded-xl text-center text-sm ${pasteMessage.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{pasteMessage}</div>}
              {imagePreviews.length > 0 && <div className="grid grid-cols-3 gap-3 mb-3">{imagePreviews.map((p, i) => (<div key={i} className="relative"><img src={p} className="w-full h-24 object-cover rounded-lg" /><button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={14} /></button></div>))}</div>}
              <div onClick={() => document.getElementById('imgInput').click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}>
                <Camera className={`mx-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={48} />
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>اختر صور أو Ctrl+V</p>
              </div>
              <button onClick={handleManualPaste} className={`mt-3 w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}><Clipboard size={20} /> لصق من الحافظة</button>
              <input id="imgInput" type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الموقع</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => handleLocationOptionChange('current')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium ${locationOption === 'current' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}><Navigation size={18} /> موقعي</button>
                <button onClick={() => handleLocationOptionChange('manual')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium ${locationOption === 'manual' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}><Link size={18} /> رابط</button>
              </div>
              {locationOption === 'current' ? (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <MapPin className="text-blue-600" size={24} />
                  <div className="flex-1">{formData.latitude ? <p className="text-sm text-green-600 font-medium">تم تحديد الموقع ✓</p> : <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>جاري التحديد...</p>}</div>
                  <button onClick={getCurrentLocation} className="p-2 hover:bg-gray-200 rounded-lg"><RefreshCw size={20} /></button>
                </div>
              ) : <input type="url" value={formData.location_url} onChange={e => handleManualLocationChange(e.target.value)} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`} placeholder="رابط Google Maps..." />}
            </div>

            <button onClick={handleSave} disabled={loading} className={`w-full py-4 rounded-xl text-white font-bold text-lg transition-all ${loading ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'}`}>
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> جاري الحفظ...</span> : <span className="flex items-center justify-center gap-2"><Upload size={20} /> حفظ</span>}
            </button>
          </div>
        </div>

        <div className={`rounded-2xl shadow-lg p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}><ImageIcon className={darkMode ? 'text-purple-400' : 'text-purple-600'} size={20} /></div>
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>منتجات اليوم ({filtered.length})</h2>
            </div>
            <button onClick={fetchTodayProducts} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw size={20} /></button>
          </div>
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث..." className={`w-full pr-10 pl-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
          </div>
          {filtered.length === 0 ? <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>لا توجد منتجات</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map(p => (
                <div key={p.id} className={`relative rounded-xl overflow-hidden ${p.status === 'sold' ? 'opacity-60' : ''}`}>
                  <img src={p.image_url} className="w-full h-32 object-cover" />
                  {p.images?.length > 1 && <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">+{p.images.length - 1}</div>}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-2">
                    <p className="text-white text-xs font-medium">{p.product_type === 'أخرى' ? p.product_value : p.product_type}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'sold' ? 'bg-red-500' : 'bg-green-500'} text-white`}>{p.status === 'sold' ? 'مباع' : 'متاح'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
