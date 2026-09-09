'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyticsStats {
  period: { days: number; from: string; to: string };
  summary: {
    visits: number;
    masterClicks: number;
    bookClicks: number;
    yclientsOpens: number;
    conversionRate: string;
  };
  visitsByDay: Record<string, number>;
  sources: Record<string, number>;
  devices: Record<string, number>;
  topMasters: Array<{ name: string; clicks: number }>;
  recentEvents: Array<{
    id: string;
    timestamp: string;
    type: string;
    data: any;
  }>;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/analytics/stats?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Загрузка...</div>;
  }

  const maxVisits = Math.max(...Object.values(stats.visitsByDay), 1);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">📊 Аналитика конверсии</h1>
          <div className="flex gap-2">
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 rounded font-medium transition ${
                  days === d ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {d} дней
              </button>
            ))}
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Посещения" value={stats.summary.visits} color="blue" />
          <MetricCard label="Клики по мастерам" value={stats.summary.masterClicks} color="purple" />
          <MetricCard label="Клики «Записаться»" value={stats.summary.bookClicks} color="green" />
          <MetricCard label="Открытия YClients" value={stats.summary.yclientsOpens} color="orange" />
          <MetricCard label="Конверсия" value={`${stats.summary.conversionRate}%`} color="red" />
        </div>

        {/* График посещений */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Посещения по дням</h2>
          {Object.keys(stats.visitsByDay).length === 0 ? (
            <p className="text-gray-500 text-center py-8">Нет данных за выбранный период</p>
          ) : (
            <div className="flex items-end gap-3 h-48 border-b border-gray-700 pb-2">
              {Object.entries(stats.visitsByDay).map(([date, count]) => {
                const heightPercent = (count / maxVisits) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center justify-end h-full">
                    {/* Число над столбиком */}
                    <div className="text-xs text-gray-400 mb-1 font-medium">{count}</div>
                    {/* Сам столбик */}
                    <div
                      className="w-full max-w-12 bg-blue-600 rounded-t transition-all hover:bg-blue-500 cursor-pointer"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      title={`${date}: ${count} посещений`}
                    />
                    {/* Дата под столбиком */}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Источники и устройства */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Источники трафика</h2>
            {Object.entries(stats.sources).length === 0 ? (
              <p className="text-gray-500">Нет данных</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.sources).map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-gray-300">{source}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Устройства</h2>
            <div className="space-y-2">
              {Object.entries(stats.devices).map(([device, count]) => (
                <div key={device} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{device}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Топ мастеров */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Топ мастеров по кликам</h2>
          {stats.topMasters.length === 0 ? (
            <p className="text-gray-500">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {stats.topMasters.map((master, idx) => (
                <div key={master.name} className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-600 w-8">#{idx + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{master.name}</div>
                    <div className="text-sm text-gray-400">{master.clicks} кликов</div>
                  </div>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(master.clicks / stats.topMasters[0].clicks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Последние события */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Последние события</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 p-2 bg-gray-900/50 rounded">
                <div className="text-xs text-gray-500 w-32">
                  {new Date(event.timestamp).toLocaleString('ru-RU')}
                </div>
                <div className="text-sm">
                  <span className="font-medium">{getEventLabel(event.type)}</span>
                  {event.data.master_name && (
                    <span className="text-gray-400"> → {event.data.master_name}</span>
                  )}
                  {event.data.device && (
                    <span className="text-gray-500 text-xs ml-2">({event.data.device})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-800',
    purple: 'from-purple-600 to-purple-800',
    green: 'from-green-600 to-green-800',
    orange: 'from-orange-600 to-orange-800',
    red: 'from-red-600 to-red-800',
  };

  return (
    <div className="bg-linear-to-br from-blue-500 to-purple-500">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function getEventLabel(type: string): string {
  const labels: Record<string, string> = {
    visit: '🌐 Посещение',
    master_click: '👤 Клик по мастеру',
    book_click: '📝 Клик «Записаться»',
    yclients_open: '🚀 Открытие YClients',
  };
  return labels[type] || type;
}