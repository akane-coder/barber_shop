'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CurrentUser {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  barberId?: string | null;
}

interface PortfolioItem {
  id: string;
  url: string;
  title?: string;
  created_at?: string;
}

interface Barber {
  id: string;
  name: string;
  photo_url?: string;
  portfolio?: PortfolioItem[];
}

export default function PortfolioPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userRes = await fetch('/api/admin/me');
      if (!userRes.ok) {
        router.push('/admin/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData);

      if (userData.role === 'admin') {
        const barbersRes = await fetch('/api/admin/barbers');
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json();
          setBarber(barbersData[0] || null);
        }
      } else if (userData.barberId) {
        const barbersRes = await fetch('/api/admin/barbers');
        if (barbersRes.ok) {
          const barbersData = await barbersRes.json();
          const myBarber = barbersData.find((b: Barber) => b.id === userData.barberId);
          setBarber(myBarber || null);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPhotoUrl.trim()) {
      setMessage({ type: 'error', text: 'Введите ссылку на фото' });
      return;
    }

    setMessage(null);

    try {
      const updatedPortfolio = [
        ...(barber?.portfolio || []),
        {
          id: `photo-${Date.now()}`,
          url: newPhotoUrl.trim(),
          title: newPhotoTitle.trim() || undefined,
          created_at: new Date().toISOString(),
        },
      ];

      const updatedBarber = {
        ...barber!,
        portfolio: updatedPortfolio,
      };

      const res = await fetch('/api/admin/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBarber),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Фото добавлено!' });
        setNewPhotoUrl('');
        setNewPhotoTitle('');
        setBarber(updatedBarber);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при сохранении' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка при добавлении' });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Удалить это фото из портфолио?')) return;

    try {
      const updatedPortfolio = (barber?.portfolio || []).filter(p => p.id !== photoId);
      const updatedBarber = { ...barber!, portfolio: updatedPortfolio };

      const res = await fetch('/api/admin/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBarber),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Фото удалено' });
        setBarber(updatedBarber);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при удалении' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ошибка при удалении' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  }

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Ошибка загрузки</div>;
  }

  if (currentUser.role === 'user' && !currentUser.barberId) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">⚠️ Ваш аккаунт не привязан к мастеру</h1>
          <p className="text-gray-400 mb-6">Обратитесь к администратору для привязки к мастеру.</p>
          <button onClick={() => router.push('/admin/dashboard')} className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded">
            ← На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold"> Моё портфолио</h1>
            {barber && <p className="text-gray-400 mt-1">Мастер: {barber.name}</p>}
          </div>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
          >
            ← Назад
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4">Портфолио (до 7 работ)</h2>
          <form onSubmit={handleAddPhoto} className="space-y-4">
            <div>
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://cdn.jsdelivr.net/gh/..."
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-sm"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPhotoTitle}
                onChange={(e) => setNewPhotoTitle(e.target.value)}
                placeholder="Название работы (например: Классический фейд)"
                className="flex-1 p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-medium transition"
              >
                Добавить фото
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-3">
             Загрузите фото в GitHub репозиторий и вставьте ссылку вида: https://cdn.jsdelivr.net/gh/username/repo@branch/public/images/portfolio/foto.jpg
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Мои работы ({barber?.portfolio?.length || 0})</h2>
          
          {barber?.portfolio && barber.portfolio.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {barber.portfolio.map((photo) => (
                <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={photo.url}
                    alt={photo.title || 'Работа мастера'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                    }}
                  />
                  {photo.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
                      <p className="text-sm text-white truncate">{photo.title}</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">📷 Портфолио пусто</p>
              <p className="text-sm">Добавьте свою первую работу выше</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}