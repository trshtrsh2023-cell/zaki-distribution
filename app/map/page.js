'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import TopNavbar from '../components/TopNavbar';
import { Map, MapPin, Navigation, RefreshCw, ExternalLink, Package, CheckCircle, Search, Layers } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function MapPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    checkUser();
    fetchPoints();
    getCurrentLocation();
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, []);

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
      const { data } = await supabase.from('distribution_points').select('*').order('created_at', { ascending: false });
      setPoints(data || []);
    } catch (error) { console.error('Error:', error); }
    setLoading(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }
  };

  const handleLogout = () => { localStorage.clear(); document.cookie = 'user_token=; path=/; max-age=0'; document.cookie = 'user_role=; path=/; max-age=0'; router.push('/login'); };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const openInGoogleMaps = (point) => {
    if (point.location_url) window.open(point.location_url, '_blank');
    else if (point.latitude && point.longitude) window.open(`https://maps.google.com/?q=${point.latitude},${point.longitude}`, '_blank');
  };

  const navigateToPoint = (point) => {
    if (point.latitude && point.longitude) window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`, '_blank');
  };

  const getProductDisplay = (p) => p.product_type === 'أخرى' ? (p.product_value || 'غير محدد') : p.product_type;

  const filteredPoints = points
    .filter(p => {
      const matchesFilter = filter === 'all' || p.status === filter;
      const matchesSearch = getProductDisplay(p).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .map(p => ({ ...p, distance: currentLocation ? calculateDistance(currentLocation.lat, currentLocation.lng, p.latitude, p.longitude) : null }))
    .sort((a, b) => (a.distance && b.distance) ? a.distance - b.distance : 0);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <TopNavbar user={user} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}><Map className={darkMode ? 'text-green-400' : 'text-green-600'} size={28} /></div>
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>خريطة التوزيع</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{filteredPoints.length} نقطة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={getCurrentLocation} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800 text-blue-400' : 'bg-white text-blue-600'} shadow`}><Navigation size={20} /></button>
            <button onClick={fetchPoints} className={`p-2 rounded-xl ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow`}><RefreshCw size={20} /></button>
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث..." className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
            </div>
            <div className="flex gap-2">
              {[{ key: 'all', label: 'الكل' }, { key: 'active', label: 'متاح' }, { key: 'sold', label: 'مباع' }].map(item => (
                <button key={item.key} onClick={() => setFilter(item.key)} className={`px-4 py-2 rounded-xl font-medium ${filter === item.key ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{item.label}</button>
              ))}
            </div>
            <button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}><Layers size={20} /></button>
          </div>
        </div>

        {currentLocation && (
          <div className={`${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 mb-6 flex items-center gap-3`}>
            <Navigation className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={20} />
            <div>
              <p className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>موقعك محدد</p>
              <p className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>النقاط مرتبة بالقرب</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
        ) : filteredPoints.length === 0 ? (
          <div className={`text-center py-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg`}>
            <MapPin className="mx-auto mb-4 text-gray-300" size={64} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا توجد نقاط</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredPoints.map((point) => (
              <div key={point.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 cursor-pointer`} onClick={() => setSelectedPoint(selectedPoint?.id === point.id ? null : point)}>
                <div className="flex items-start gap-4">
                  <img src={point.image_url} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getProductDisplay(point)}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-sm flex items-center gap-1 ${point.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                        <CheckCircle size={14} /> {point.status === 'active' ? 'متاح' : 'مباع'}
                      </span>
                      {point.distance && <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>📍 {point.distance.toFixed(1)} كم</span>}
                    </div>
                    {selectedPoint?.id === point.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        <button onClick={(e) => { e.stopPropagation(); openInGoogleMaps(point); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><MapPin size={16} /> الخريطة</button>
                        <button onClick={(e) => { e.stopPropagation(); navigateToPoint(point); }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"><Navigation size={16} /> تنقل</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPoints.map((point) => (
              <div key={point.id} onClick={() => openInGoogleMaps(point)} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl`}>
                <div className="relative">
                  <img src={point.image_url} className="w-full h-32 object-cover" />
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${point.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white`}>{point.status === 'active' ? 'متاح' : 'مباع'}</span>
                  {point.distance && <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-full">{point.distance.toFixed(1)} كم</span>}
                </div>
                <div className="p-3"><h3 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getProductDisplay(point)}</h3></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
