'use client';

import { Lock } from 'lucide-react';

export default function ProtectedContent({ children, requiredRoles = [], userRole, darkMode = false }) {
  const hasAccess = requiredRoles.includes(userRole);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-50 blur-[2px]" style={{ filter: 'grayscale(50%)' }}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
        <div className={`text-center p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'}`}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
            <Lock className={darkMode ? 'text-red-400' : 'text-red-500'} size={32} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>غير مصرح لك</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ليس لديك صلاحية للتفاعل مع هذا المحتوى</p>
        </div>
      </div>
    </div>
  );
}
