import { MasterLoadStatus } from '@/types';

interface StatusBadgeProps {
  status: MasterLoadStatus | null;
  lastUpdated?: string;
}

export default function StatusBadge({ status, lastUpdated }: StatusBadgeProps) {
  const getStatusConfig = (status: MasterLoadStatus | null) => {
    switch (status) {
      case MasterLoadStatus.IMMEDIATE:
        return {
          color: 'bg-green-500',
          pulse: true,
          label: 'Свободен сейчас',
          description: 'Окна в ближайшие 2 часа',
        };
      case MasterLoadStatus.TODAY:
        return {
          color: 'bg-yellow-500',
          pulse: false,
          label: 'Есть сегодня',
          description: 'Окна сегодня, но позже',
        };
      case MasterLoadStatus.TOMORROW:
        return {
          color: 'bg-blue-500',
          pulse: false,
          label: 'Есть завтра',
          description: 'Запись на завтра',
        };
      case MasterLoadStatus.IN_2_DAYS: // ✅ ИСПРАВЛЕНО: отдельный кейс для послезавтра
        return {
          color: 'bg-indigo-500',
          pulse: false,
          label: 'Есть послезавтра',
          description: 'Запись через 2 дня',
        };
      case MasterLoadStatus.IN_3_4_DAYS:
        return {
          color: 'bg-gray-400',
          pulse: false,
          label: 'Высокая загрузка',
          description: 'Запись на 3-4 дня',
        };
      case MasterLoadStatus.FULLY_BOOKED:
        return {
          color: 'bg-red-500',
          pulse: false,
          label: 'Полная запись',
          description: 'Нет мест на 4+ дня',
        };
      case MasterLoadStatus.MANUAL_OVERRIDE:
        return {
          color: 'bg-purple-500',
          pulse: false,
          label: 'Ручной статус',
          description: 'Уточняйте у администратора',
        };
      default:
        return {
          color: 'bg-gray-500',
          pulse: false,
          label: 'Статус неизвестен',
          description: 'Уточняйте у администратора',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
          {config.pulse && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-ping opacity-75`}></div>
          )}
        </div>
        <span className="text-sm font-medium text-white">{config.label}</span>
      </div>
      {lastUpdated && (
        <span className="text-xs text-gray-400 ml-5">
          Обновлено: {lastUpdated}
        </span>
      )}
    </div>
  );
}