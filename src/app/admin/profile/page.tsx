'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CurrentUser {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  barberId?: string;
}

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Пароль должен быть минимум 4 символа' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Пароль успешно изменён!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Ошибка смены пароля' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка соединения' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Мой профиль</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
          >
            ← Назад
          </button>
        </div>

        {/* Информация о пользователе */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6">
          <h2 className="text-xl font-bold mb-4">Информация</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Логин:</span> <span className="text-white font-medium">{currentUser.username}</span></p>
            <p><span className="text-gray-500">Роль:</span> <span className="text-white font-medium">{currentUser.role === 'admin' ? 'Администратор' : 'Мастер'}</span></p>
            {currentUser.barberId && (
              <p><span className="text-gray-500">ID мастера:</span> <span className="text-white font-medium">{currentUser.barberId}</span></p>
            )}
          </div>
        </div>

        {/* Смена пароля */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Смена пароля</h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm mb-1">Подтвердите новый пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}