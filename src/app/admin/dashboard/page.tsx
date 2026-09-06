'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Barber, MasterLoadStatus } from '@/types';

const YCLIENTS_COMPANY_ID = 262700;

const STATUS_OPTIONS = [
  { value: '', label: '🔄 Авто (из YClients)' },
  { value: MasterLoadStatus.IMMEDIATE, label: '🟢 Свободен сейчас' },
  { value: MasterLoadStatus.TODAY, label: '🟡 Есть сегодня' },
  { value: MasterLoadStatus.TOMORROW, label: '🔵 Есть завтра' },
  { value: MasterLoadStatus.IN_2_DAYS, label: '🔵 Послезавтра' },
  { value: MasterLoadStatus.IN_3_4_DAYS, label: '⚪ Высокая загрузка' },
  { value: MasterLoadStatus.FULLY_BOOKED, label: '🔴 Полная запись' },
];

interface CurrentUser {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  barberId?: string;
}

export default function AdminDashboard() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCurrentUser();
    loadBarbers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Ошибка загрузки пользователя:', err);
    }
  };

  const loadBarbers = async () => {
    try {
      const res = await fetch('/api/admin/barbers');
      if (res.ok) {
        const data = await res.json();
        setBarbers(data);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch('/api/admin/sync-all', { method: 'POST' });
      if (res.ok) {
        alert('✅ Статусы успешно обновлены!');
        loadBarbers();
      } else {
        alert('❌ Ошибка при обновлении статусов');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка сети');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleOverrideStatus = async (barberId: string, status: MasterLoadStatus | null) => {
    try {
      const res = await fetch('/api/admin/override-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId, status }),
      });
      if (res.ok) {
        loadBarbers();
      } else {
        alert('Ошибка сохранения статуса');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить мастера?')) return;
    const res = await fetch('/api/admin/barbers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      loadBarbers();
    }
  };

  const getYClientsLink = (staffId: number) => {
    return `https://b270235.yclients.com/company/${YCLIENTS_COMPANY_ID}/personal/select-master/master-info/${YCLIENTS_COMPANY_ID}/${staffId}?o=m${staffId}`;
  };

  if (loading || !currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'Управление мастерами' : 'Мой кабинет'}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Привет, {currentUser.username}! Роль: {isAdmin ? 'Администратор' : 'Мастер'}
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            {/* Кнопка "Открыть сайт" — для всех */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold transition flex items-center gap-2"
            >
              🌐 Открыть сайт
            </a>
            
            {/* Кнопка "Профиль" — для всех */}
            <button
              onClick={() => router.push('/admin/profile')}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold transition flex items-center gap-2"
            >
              👤 Профиль
            </button>
            
            {/* Кнопка "Аналитика" — для всех */}
            <button
              onClick={() => router.push('/admin/analytics')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold transition flex items-center gap-2"
            >
              📊 Аналитика
            </button>
            
            {/* Кнопки только для админа */}
            {isAdmin && (
              <>
                <button
                  onClick={handleSyncAll}
                  disabled={syncingAll}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded font-bold transition flex items-center gap-2"
                >
                  {syncingAll ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Обновление...
                    </>
                  ) : '🔄 Обновить все статусы'}
                </button>
                
                <button
                  onClick={() => router.push('/admin/barbers/new')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold transition"
                >
                  + Добавить мастера
                </button>

                <button
                  onClick={() => router.push('/admin/users')}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold transition flex items-center gap-2"
                >
                  👥 Пользователи
                </button>

              </>
            )}
            
            {/* Кнопка "Моё портфолио" — только для user */}
            {!isAdmin && currentUser.barberId && (
              <button
                onClick={() => router.push('/admin/portfolio')}
                className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-bold transition flex items-center gap-2"
              >
                🖼 Моё портфолио
              </button>
            )}
          </div>
        </div>

        {/* Контент */}
        {isAdmin ? (
          // Полный дашборд для админа
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <div key={barber.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={barber.photo_url || 'https://via.placeholder.com/64'}
                    alt={barber.name}
                    className="w-16 h-16 rounded-full object-cover bg-gray-700 border-2 border-gray-600"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{barber.name}</h3>
                    <p className="text-gray-400 text-sm">{barber.role}</p>
                  </div>
                </div>
                
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Статус загрузки</label>
                  <select
                    value={barber.manual_status || ''}
                    onChange={(e) => handleOverrideStatus(barber.id, e.target.value as MasterLoadStatus || null)}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-sm focus:border-blue-500 outline-none"
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {barber.manual_status ? '⚠️ Задан вручную' : '🔄 Берется из YClients'}
                  </p>
                </div>
                
                <div className="space-y-1 text-sm text-gray-300 mb-4 flex-1">
                  <p><span className="text-gray-500">YClients ID:</span> {barber.yclients_staff_id}</p>
                  <p><span className="text-gray-500">Услуги:</span> {barber.services?.length || 0} | <span className="text-gray-500">Фото:</span> {barber.portfolio?.length || 0}</p>
                  {(barber.rating || 0) > 0 && (
                    <p><span className="text-gray-500">Рейтинг:</span> ⭐ {barber.rating?.toFixed(1)} ({barber.reviewsCount || 0})</p>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <a
                    href={getYClientsLink(barber.yclients_staff_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm transition"
                  >
                    Открыть в YClients ↗
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/barbers/${barber.id}/edit`)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm transition"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(barber.id)}
                      className="bg-red-900 hover:bg-red-800 px-3 py-2 rounded text-sm transition"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Упрощённый дашборд для user
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center">
            <h2 className="text-2xl font-bold mb-4">Добро пожаловать, {currentUser.username}!</h2>
            <p className="text-gray-400 mb-6">
              Здесь вы можете управлять своим профилем, добавлять работы в портфолио и просматривать аналитику.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => router.push('/admin/profile')}
                className="bg-indigo-600 hover:bg-indigo-700 p-6 rounded-lg transition"
              >
                <div className="text-4xl mb-2">👤</div>
                <div className="font-bold">Мой профиль</div>
                <div className="text-sm text-gray-300 mt-1">Смена пароля</div>
              </button>
              
              {currentUser.barberId && (
                <button
                  onClick={() => router.push('/admin/portfolio')}
                  className="bg-orange-600 hover:bg-orange-700 p-6 rounded-lg transition"
                >
                  <div className="text-4xl mb-2">🖼</div>
                  <div className="font-bold">Портфолио</div>
                  <div className="text-sm text-gray-300 mt-1">Добавить работы</div>
                </button>
              )}
              
              <button
                onClick={() => router.push('/admin/analytics')}
                className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg transition"
              >
                <div className="text-4xl mb-2">📊</div>
                <div className="font-bold">Аналитика</div>
                <div className="text-sm text-gray-300 mt-1">Статистика сайта</div>
              </button>
            </div>
          </div>
        )}

        {isAdmin && barbers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl mb-4">Мастера не добавлены</p>
          </div>
        )}
      </div>
    </div>
  );
}