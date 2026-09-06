'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  barberId?: string | null;
  createdAt: string;
}

interface Barber {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Форма
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, barbersRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/barbers')
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (barbersRes.ok) setBarbers(await barbersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload: any = {
      username: newUsername,
      password: newPassword,
      role: newRole,
    };

    if (newRole === 'user' && selectedBarberId) {
      payload.barberId = selectedBarberId;
    }

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess('Пользователь успешно создан!');
      setNewUsername('');
      setNewPassword('');
      setSelectedBarberId('');
      loadData();
    } else {
      const data = await res.json();
      setError(data.error || 'Ошибка создания');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этого пользователя?')) return;
    
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Пользователь удалён');
      loadData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">👥 Управление пользователями</h1>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition">
            ← Назад в дашборд
          </button>
        </div>

        {/* Форма создания */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Добавить нового пользователя</h2>
          {error && <p className="text-red-400 mb-4 bg-red-900/30 p-2 rounded">{error}</p>}
          {success && <p className="text-green-400 mb-4 bg-green-900/30 p-2 rounded">{success}</p>}
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Логин</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Пароль</label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Роль</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
              >
                <option value="user">Мастер (User)</option>
                <option value="admin">Администратор (Admin)</option>
              </select>
            </div>
            {newRole === 'user' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Привязать к мастеру (опционально)</label>
                <select
                  value={selectedBarberId}
                  onChange={(e) => setSelectedBarberId(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                >
                  <option value="">-- Не привязывать --</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Пользователь сможет редактировать портфолио только этого мастера.</p>
              </div>
            )}
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
                Создать пользователя
              </button>
            </div>
          </form>
        </div>

        {/* Таблица пользователей */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300">
              <tr>
                <th className="p-4">Логин</th>
                <th className="p-4">Роль</th>
                <th className="p-4">Привязка к мастеру</th>
                <th className="p-4">Дата создания</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => {
                const linkedBarber = barbers.find(b => b.id === user.barberId);
                return (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="p-4 font-medium">{user.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === 'admin' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'
                      }`}>
                        {user.role === 'admin' ? 'Админ' : 'Мастер'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {linkedBarber ? linkedBarber.name : '—'}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="p-4 text-right">
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">Пользователи не найдены</div>
          )}
        </div>
      </div>
    </div>
  );
}