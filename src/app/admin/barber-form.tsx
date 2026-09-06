'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Barber, MasterLoadStatus, PortfolioItem } from '@/types';

const YCLIENTS_COMPANY_ID = 262700;

interface BarberFormProps {
  initialData?: Barber | null;
  onSubmit?: (barber: Barber) => void;
}

export default function BarberForm({ initialData, onSubmit }: BarberFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [yclientsStatus, setYclientsStatus] = useState<MasterLoadStatus | null>(null);
  
  // Состояния для динамических списков
  const [specInput, setSpecInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioTitle, setPortfolioTitle] = useState('');

  const [formData, setFormData] = useState<Barber>({
    id: initialData?.id || `barber-${Date.now()}`,
    yclients_staff_id: initialData?.yclients_staff_id || 0,
    name: initialData?.name || '',
    role: initialData?.role || 'Барбер',
    specializations: initialData?.specializations || [],
    is_top: initialData?.is_top || false,
    is_active: initialData?.is_active ?? true,
    photo_url: initialData?.photo_url || '',
    portfolio: initialData?.portfolio || [],
    bio: initialData?.bio || '',
    services: initialData?.services || [],
    rating: initialData?.rating || 0,
    reviewsCount: initialData?.reviewsCount || 0,
  });

  // Функция синхронизации с YClients
  const handleSyncYClients = async () => {
    if (!formData.yclients_staff_id) {
      alert('Сначала введите YClients Staff ID');
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch('/api/parse-yclients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffIds: [formData.yclients_staff_id] }),
      });

      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        setYclientsStatus(data.data[0].status);
        alert(`Статус получен: ${getStatusLabel(data.data[0].status)}`);
      } else {
        alert('Не удалось получить статус');
      }
    } catch (err) {
      console.error('Sync error:', err);
      alert('Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  };

  // Helpers для статусов
  const getStatusColor = (status: MasterLoadStatus) => {
    switch (status) {
      case MasterLoadStatus.IMMEDIATE: return 'text-green-500';
      case MasterLoadStatus.TODAY: return 'text-yellow-500';
      case MasterLoadStatus.TOMORROW:
      case MasterLoadStatus.IN_2_DAYS: return 'text-blue-500';
      case MasterLoadStatus.IN_3_4_DAYS: return 'text-gray-400';
      case MasterLoadStatus.FULLY_BOOKED: return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusLabel = (status: MasterLoadStatus) => {
    const labels: Record<MasterLoadStatus, string> = {
      [MasterLoadStatus.IMMEDIATE]: '🟢 Свободен сейчас',
      [MasterLoadStatus.TODAY]: '🟡 Есть сегодня',
      [MasterLoadStatus.TOMORROW]: '🔵 Есть завтра',
      [MasterLoadStatus.IN_2_DAYS]: '🔵 Есть послезавтра',
      [MasterLoadStatus.IN_3_4_DAYS]: '⚪ Высокая загрузка',
      [MasterLoadStatus.FULLY_BOOKED]: '🔴 Полная запись',
      [MasterLoadStatus.MANUAL_OVERRIDE]: '🟣 Ручной статус',
    };
    return labels[status] || status;
  };

  // Работа со специализациями
  const handleAddSpec = () => {
    if (specInput.trim() && !formData.specializations.includes(specInput.trim())) {
      setFormData({ 
        ...formData, 
        specializations: [...formData.specializations, specInput.trim()] 
      });
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (spec: string) => {
    setFormData({ 
      ...formData, 
      specializations: formData.specializations.filter(s => s !== spec) 
    });
  };

  // Работа с услугами
  const handleAddService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData({ 
        ...formData, 
        services: [...formData.services, serviceInput.trim()] 
      });
      setServiceInput('');
    }
  };

  const handleRemoveService = (service: string) => {
    setFormData({ 
      ...formData, 
      services: formData.services.filter(s => s !== service) 
    });
  };

  // Работа с портфолио
  const handleAddPortfolio = () => {
    if (portfolioUrl.trim()) {
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        url: portfolioUrl.trim(),
        title: portfolioTitle.trim() || 'Работа мастера',
        tags: [],
      };
      setFormData({ 
        ...formData, 
        portfolio: [...formData.portfolio, newItem] 
      });
      setPortfolioUrl('');
      setPortfolioTitle('');
    }
  };

  const handleRemovePortfolio = (id: string) => {
    setFormData({ 
      ...formData, 
      portfolio: formData.portfolio.filter(p => p.id !== id) 
    });
  };

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (onSubmit) {
        // Если передан callback, используем его
        onSubmit(formData);
      } else {
        // Иначе отправляем на API
        const res = await fetch('/api/admin/barbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const data = await res.json();
          router.push('/admin/dashboard');
          router.refresh();
        } else {
          const error = await res.json();
          alert(`Ошибка сохранения: ${error.error || 'Неизвестная ошибка'}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  // Генерация ссылки на YClients
  const getYClientsLink = () => {
    if (!formData.yclients_staff_id) return null;
    return `https://b270235.yclients.com/company/${YCLIENTS_COMPANY_ID}/personal/select-master/master-info/${YCLIENTS_COMPANY_ID}/${formData.yclients_staff_id}?o=m${formData.yclients_staff_id}`;
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto text-white space-y-6">
      <h2 className="text-2xl font-bold mb-6">
        {initialData ? 'Редактировать мастера' : 'Новый мастер'}
      </h2>

      {/* Основные данные */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 text-gray-400">Имя и Фамилия *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="Например: Иван Петров"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-400">Должность</label>
          <select
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
          >
            <option>Барбер</option>
            <option>Старший барбер</option>
            <option>Топ-барбер</option>
          </select>
        </div>
      </div>

      {/* YClients Staff ID */}
      <div>
        <label className="block text-sm mb-1 text-blue-400 font-semibold">
          YClients Staff ID *
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            required
            value={formData.yclients_staff_id || ''}
            onChange={e => setFormData({...formData, yclients_staff_id: Number(e.target.value)})}
            className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="Например: 5772390"
          />
          <button
            type="button"
            onClick={handleSyncYClients}
            disabled={syncing || !formData.yclients_staff_id}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 transition"
          >
            {syncing ? 'Проверка...' : 'Синхронизировать'}
          </button>
          {getYClientsLink() && (
            <a
              href={getYClientsLink()!}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition flex items-center"
            >
              Открыть в YClients ↗
            </a>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ID мастера из системы YClients. Нажмите "Синхронизировать" чтобы проверить статус загрузки.
        </p>
        {yclientsStatus && (
          <div className="mt-2 p-2 bg-gray-700 rounded">
            <p className={`text-sm font-medium ${getStatusColor(yclientsStatus)}`}>
              {getStatusLabel(yclientsStatus)}
            </p>
          </div>
        )}
      </div>

      {/* Фото мастера */}
      <div>
        <label className="block text-sm mb-1 text-gray-400">
          Ссылка на фото (jsDelivr / GitHub)
        </label>
        <input
          type="url"
          value={formData.photo_url}
          onChange={e => setFormData({...formData, photo_url: e.target.value})}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
          placeholder="https://cdn.jsdelivr.net/gh/username/repo@main/public/images/masters/photo.jpg"
        />
        {formData.photo_url && (
          <div className="mt-2">
            <img
              src={formData.photo_url}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-gray-600"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Био */}
      <div>
        <label className="block text-sm mb-1 text-gray-400">О мастере (Био)</label>
        <textarea
          value={formData.bio}
          onChange={e => setFormData({...formData, bio: e.target.value})}
          rows={3}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
          placeholder="Например: Барбер, специализирующийся на коротких мужских стрижках и моделировании бороды. Опытный мастер, который ценит перфекционизм в работе и абсолютный комфорт клиента."
        />
      </div>

      {/* Специализации */}
      <div>
        <label className="block text-sm mb-1 text-gray-400">Специализации (теги)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={specInput}
            onChange={e => setSpecInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSpec())}
            className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="Например: Фейды"
          />
          <button
            type="button"
            onClick={handleAddSpec}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.specializations.map(spec => (
            <span
              key={spec}
              className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-sm flex items-center gap-2"
            >
              {spec}
              <button
                type="button"
                onClick={() => handleRemoveSpec(spec)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Услуги */}
      <div>
        <label className="block text-sm mb-1 text-gray-400">Услуги, которые выполняет</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={serviceInput}
            onChange={e => setServiceInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
            className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="Например: Мужская стрижка"
          />
          <button
            type="button"
            onClick={handleAddService}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.services.map((service, idx) => (
            <span
              key={idx}
              className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm flex items-center gap-2"
            >
              {service}
              <button
                type="button"
                onClick={() => handleRemoveService(service)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Портфолио */}
      <div>
        <label className="block text-sm mb-1 text-gray-400">Портфолио (до 7 работ)</label>
        <div className="space-y-2 mb-2">
          <input
            type="url"
            value={portfolioUrl}
            onChange={e => setPortfolioUrl(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="https://cdn.jsdelivr.net/gh/..."
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={portfolioTitle}
              onChange={e => setPortfolioTitle(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
              placeholder="Название работы (например: Классический фейд)"
            />
            <button
              type="button"
              onClick={handleAddPortfolio}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded"
            >
              Добавить фото
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {formData.portfolio.map(item => (
            <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-600">
              <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemovePortfolio(item.id)}
                className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-1 text-center truncate">
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Рейтинг и отзывы */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 text-gray-400">Рейтинг (0-5)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formData.rating}
            onChange={e => setFormData({...formData, rating: Number(e.target.value)})}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-400">Количество отзывов</label>
          <input
            type="number"
            min="0"
            value={formData.reviewsCount}
            onChange={e => setFormData({...formData, reviewsCount: Number(e.target.value)})}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Флаги */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={e => setFormData({...formData, is_active: e.target.checked})}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm">Активен (отображается на сайте)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_top}
            onChange={e => setFormData({...formData, is_top: e.target.checked})}
            className="w-4 h-4 rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm">Показывать первым (Топ)</span>
        </label>
      </div>

      {/* Кнопки */}
      <div className="flex gap-4 pt-4 border-t border-gray-700">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50"
        >
          {loading ? 'Сохранение...' : 'Сохранить мастера'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded transition"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}