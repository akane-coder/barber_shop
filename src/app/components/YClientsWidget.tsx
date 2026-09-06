'use client';
import { useEffect } from 'react';
import { Barber } from '@/types';

interface YClientsWidgetProps {
  barber?: Barber | null;
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export default function YClientsWidget({ barber, isOpen, onClose, onOpen }: YClientsWidgetProps) {
  const COMPANY_ID = 262700;

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  if (!isOpen) return null;

  // Если выбран конкретный мастер — ведём на select-master с параметром o=m{STAFF_ID}
  // Если нет — открываем общий выбор мастера
  const widgetUrl = barber?.yclients_staff_id
    ? `https://b270235.yclients.com/company/${COMPANY_ID}/personal/select-master?o=m${barber.yclients_staff_id}`
    : `https://b270235.yclients.com/company/${COMPANY_ID}/personal/select-master`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-900/80 hover:bg-gray-900 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <iframe
          src={widgetUrl}
          className="w-full h-full border-0"
          title="Запись онлайн"
          allow="payment"
        />
      </div>
    </div>
  );
}