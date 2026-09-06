'use client';

import { Barber, MasterLoadStatus } from '@/types';
import StatusBadge from './StatusBadge';
import Image from 'next/image';
import Link from 'next/link';

interface MasterCardProps {
  barber: Barber;
  status: MasterLoadStatus | null;
  lastUpdated?: string;
  onBook: (barber: Barber) => void;
}

export default function MasterCard({ barber, status, lastUpdated, onBook }: MasterCardProps) {
  // Рендер звёзд рейтинга
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i === fullStars && hasHalf) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-600">★</span>);
      }
    }
    return stars;
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20 group">
      
      {/* === ФОТО МАСТЕРА (кликабельное → страница мастера) === */}
      <Link href={`/barbers/${barber.id}`} className="block relative h-64 overflow-hidden">
        <Image
          src={barber.photo_url || 'https://via.placeholder.com/400x300?text=No+Photo'}
          alt={barber.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        
        {/* Градиент снизу для читаемости текста */}
        <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 via-transparent to-transparent" />
        
        {/* Бейдж ТОП-БАРБЕР */}
        {barber.is_top && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ТОП-БАРБЕР
          </div>
        )}
        
        {/* Имя поверх фото (появляется при наведении на мобилке) */}
        <div className="absolute bottom-4 left-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <p className="text-white text-sm font-medium truncate">
            Подробнее о мастере →
          </p>
        </div>
      </Link>

      {/* === КОНТЕНТ КАРТОЧКИ === */}
      <div className="p-6">
        
        {/* Имя, роль и рейтинг */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-2xl font-bold text-white truncate">{barber.name}</h3>
          </div>
          <p className="text-gray-400 text-sm mb-2">{barber.role}</p>
          
          {/* Рейтинг */}
          {(barber.rating > 0 || barber.reviewsCount > 0) && (
            <div className="flex items-center gap-2">
              <div className="flex text-sm">
                {renderStars(barber.rating || 0)}
              </div>
              <span className="text-gray-400 text-xs">
                {barber.rating?.toFixed(1) || '0.0'}
                {barber.reviewsCount > 0 && ` (${barber.reviewsCount})`}
              </span>
            </div>
          )}
        </div>

        {/* Статус загрузки */}
        <div className="mb-4">
          <StatusBadge status={status} lastUpdated={lastUpdated} />
        </div>

        {/* Специализации */}
        {barber.specializations.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Специализации</p>
            <div className="flex flex-wrap gap-1.5">
              {barber.specializations.slice(0, 4).map((spec) => (
                <span
                  key={spec}
                  className="bg-gray-700/50 text-gray-300 px-2.5 py-1 rounded-full text-xs border border-gray-600/50"
                >
                  {spec}
                </span>
              ))}
              {barber.specializations.length > 4 && (
                <span className="text-gray-500 text-xs px-2 py-1">
                  +{barber.specializations.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Превью портфолио */}
        {barber.portfolio && barber.portfolio.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Работы</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {barber.portfolio.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-700"
                >
                  <Image
                    src={item.url}
                    alt={item.title || 'Работа мастера'}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ))}
              {barber.portfolio.length > 5 && (
                <div className="shrink-0 w-14 h-14 rounded-lg bg-gray-700/50 flex items-center justify-center border border-gray-600/50">
                  <span className="text-gray-400 text-xs font-medium">
                    +{barber.portfolio.length - 5}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Кнопка записи */}
        <button
          onClick={(e) => {
            e.preventDefault(); // Предотвращаем переход по Link
            onBook(barber);
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
        >
          Записаться
        </button>
      </div>
    </div>
  );
}