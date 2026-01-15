2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>إدارة المستخدمين</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{users.length} مستخدم</p>
              </div>
            </div>
            <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={20} /> إضافة</button>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-4 mb-6`}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث..." className={`w-full pr-10 pl-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={`px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                <option value="all">الكل</option>
                <option value="owner">مالك</option>
                <option value="admin">مشرف</option>
                <option value="seller">بائع</option>
              </select>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20"><Users className="mx-auto mb-4 text-gray-300" size={64} /><p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لا يوجد مستخدمين</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-4 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>المستخدم</th>
                      <th className={`px-6 py-4 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>الدور</th>
                      <th className={`px-6 py-4 text-right text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>الحالة</th>
                      <th className={`px-6 py-4 text-center text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((u) => {
                      const badge = getRoleBadge(u.role);
                      return (
                        <tr key={u.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className="px-6 py-4"><span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{u.username}</span></td>
                          <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg}`}>{badge.label}</span></td>
                          <td className="px-6 py-4"><span className={`flex items-center gap-2 ${u.is_active ? 'text-green-600' : 'text-red-600'}`}>{u.is_active ? <UserCheck size={18} /> : <UserX size={18} />}{u.is_active ? 'نشط' : 'معطل'}</span></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditModal(u)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}><Edit2 size={18} /></button>
                              <button onClick={() => handleToggleStatus(u)} className={`p-2 rounded-lg ${u.is_active ? 'text-orange-500' : 'text-green-500'}`}>{u.is_active ? <ShieldOff size={18} /> : <Shield size={18} />}</button>
                              <button onClick={() => handleDeleteUser(u)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </ProtectedContent>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingUser ? 'تعديل' : 'إضافة مستخدم'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>اسم المستخدم</label>
                <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>كلمة المرور</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`w-full px-4 py-3 pl-12 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>الدور</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}>
                  <option value="seller">بائع</option>
                  <option value="admin">مشرف</option>
                  <option value="owner">مالك</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded" />
                <label htmlFor="is_active" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>نشط</label>
              </div>
            </div>
            <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex gap-3`}>
              <button onClick={() => setShowModal(false)} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>إلغاء</button>
              <button onClick={handleSaveUser} className="flex-1 py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
