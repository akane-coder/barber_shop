'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Barber, PortfolioItem, AVAILABLE_SERVICES, SERVICE_NAMES } from '@/types';

// В Next.js 15+ params — это Promise
export default function EditBarberPage({ params }: { params: Promise<{ id: string }> }) {
  // Распаковываем params через use()
  const { id } = use(params);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Barber | null>(null);

  // Состояния для динамических списков
  const [specInput, setSpecInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioTitle, setPortfolioTitle] = useState('');
  

  // Загрузка мастера
  useEffect(() => {
    loadBarber();
  }, [id]);

  const loadBarber = async () => {
    try {
      const res = await fetch('/api/admin/barbers');
      if (res.ok) {
        const barbers: Barber[] = await res.json();
        const barber = barbers.find((b) => b.id === id);
        if (barber) {
          setFormData(barber);
        } else {
          router.push('/admin/dashboard');
        }
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  // === Работа со специализациями ===
  const handleAddSpec = () => {
    if (specInput.trim() && formData && !formData.specializations.includes(specInput.trim())) {
      setFormData({
        ...formData,
        specializations: [...formData.specializations, specInput.trim()],
      });
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (spec: string) => {
    if (formData) {
      setFormData({
        ...formData,
        specializations: formData.specializations.filter((s) => s !== spec),
      });
    }
  };

  // === Работа с услугами (с автодополнением из справочника) ===
  const handleAddService = () => {
    if (serviceInput.trim() && formData && !formData.services.includes(serviceInput.trim())) {
      setFormData({
        ...formData,
        services: [...formData.services, serviceInput.trim()],
      });
      setServiceInput('');
    }
  };

  const handleRemoveService = (service: string) => {
    if (formData) {
      setFormData({
        ...formData,
        services: formData.services.filter((s) => s !== service),
      });
    }
  };

  const handleQuickAddService = (serviceName: string) => {
    if (formData && !(formData.services || []).includes(serviceName)) {
        setFormData({
        ...formData,
        services: [...(formData.services || []), serviceName],
        });
    }
  };

  // === Работа с портфолио ===
  const handleAddPortfolio = () => {
    if (portfolioUrl.trim() && formData) {
      const newItem: PortfolioItem = {
        id: `port-${Date.now()}`,
        url: portfolioUrl.trim(),
        title: portfolioTitle.trim() || 'Работа мастера',
        tags: [],
      };
      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, newItem],
      });
      setPortfolioUrl('');
      setPortfolioTitle('');
    }
  };

  const handleRemovePortfolio = (itemId: string) => {
    if (formData) {
      setFormData({
        ...formData,
        portfolio: formData.portfolio.filter((p) => p.id !== itemId),
      });
    }
  };

  // === Сохранение ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        const error = await res.json();
        alert(`Ошибка сохранения: ${error.error || 'Неизвестная ошибка'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  // === Рендер ===
  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

    const availableToAdd = AVAILABLE_SERVICES.filter(
    (s) => !(formData?.services || []).includes(s.name)
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white mb-6 flex items-center gap-2 transition"
        >
          ← Назад к дашборду
        </button>

        <h1 className="text-3xl font-bold mb-8">Редактирование: {formData.name}</h1>

        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
          {/* === Основные данные === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-400">Имя и Фамилия *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Должность</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              >
                <option>Барбер</option>
                <option>Старший барбер</option>
                <option>Топ-барбер</option>
              </select>
            </div>
          </div>

          {/* === YClients Staff ID === */}
          <div>
            <label className="block text-sm mb-1 text-blue-400 font-semibold">
              YClients Staff ID *
            </label>
            <input
              type="number"
              required
              value={formData.yclients_staff_id || ''}
              onChange={(e) =>
                setFormData({ ...formData, yclients_staff_id: Number(e.target.value) })
              }
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
            />
            <a
              href={`https://b270235.yclients.com/company/262700/personal/select-master/master-info/262700/${formData.yclients_staff_id}?o=m${formData.yclients_staff_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline mt-1 inline-block"
            >
              Открыть профиль мастера в YClients ↗
            </a>
          </div>

          {/* === Фото мастера === */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">
              Ссылка на фото (jsDelivr / GitHub)
            </label>
            <input
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              placeholder="https://cdn.jsdelivr.net/gh/..."
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

          {/* === Био === */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">О мастере (Био)</label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              placeholder="Например: Барбер, специализирующийся на коротких мужских стрижках и моделировании бороды..."
            />
          </div>

          {/* === Специализации === */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">Специализации (теги)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddSpec())
                }
                className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
                placeholder="Например: Фейды"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specializations.map((spec) => (
                <span
                  key={spec}
                  className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(spec)}
                    className="hover:text-white ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* === Услуги (с автодополнением из справочника) === */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">
              Услуги, которые выполняет мастер
            </label>

            {/* Поле ввода с автодополнением */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddService())
                }
                list="services-datalist"
                className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
                placeholder="Начните вводить (например: Стрижка)..."
              />
              <datalist id="services-datalist">
                {SERVICE_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={handleAddService}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
              >
                +
              </button>
            </div>

            {/* Выбранные услуги */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.services?.map((service, idx) => (
                <span
                  key={idx}
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {service}
                  <button
                    type="button"
                    onClick={() => handleRemoveService(service)}
                    className="hover:text-white ml-1"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Быстрое добавление из справочника */}
            {availableToAdd.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Быстрое добавление:</p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map((service) => (
                    <button
                      key={service.name}
                      type="button"
                      onClick={() => handleQuickAddService(service.name)}
                      className="bg-gray-700/50 hover:bg-blue-900/50 text-gray-300 hover:text-blue-200 px-3 py-1 rounded-full text-xs border border-gray-600 transition"
                    >
                      + {service.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* === Портфолио === */}
          <div>
            <label className="block text-sm mb-1 text-gray-400">
              Портфолио (до 7 работ)
            </label>
            <div className="space-y-2 mb-2">
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
                placeholder="https://cdn.jsdelivr.net/gh/..."
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={portfolioTitle}
                  onChange={(e) => setPortfolioTitle(e.target.value)}
                  className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
                  placeholder="Название работы (например: Классический фейд)"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolio}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
                >
                  Добавить фото
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formData.portfolio?.map((item) => (
                <div
                  key={item.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-600"
                >
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

          {/* === Рейтинг и настройки === */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div>
              <label className="block text-sm mb-1 text-gray-400">Рейтинг (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating || 0}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-400">Кол-во отзывов</label>
              <input
                type="number"
                min="0"
                value={formData.reviewsCount || 0}
                onChange={(e) =>
                  setFormData({ ...formData, reviewsCount: Number(e.target.value) })
                }
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div className="flex flex-col justify-end gap-3 pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                />
                <span className="text-sm">Активен</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_top}
                  onChange={(e) => setFormData({ ...formData, is_top: e.target.checked })}
                  className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                />
                <span className="text-sm">Топ-барбер</span>
              </label>
            </div>
          </div>

          {/* === Кнопки === */}
          <div className="flex gap-4 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}