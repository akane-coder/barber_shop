'use client';
import { useState } from 'react';
import { Barber, MasterLoadStatus } from '@/types';
import MasterCard from './MasterCard';

interface TeamSectionProps {
  barbers: Barber[];
  getEffectiveStatus: (barber: Barber) => MasterLoadStatus | null;
  lastUpdated: string;
  onBook: (barber: Barber) => void;
  onMasterClick?: (barber: Barber) => void;
}

export default function TeamSection({ 
  barbers, 
  getEffectiveStatus, 
  lastUpdated, 
  onBook,
  onMasterClick 
}: TeamSectionProps) {
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const sortedBarbers = [...barbers].sort((a, b) => {
    if (a.is_top && !b.is_top) return -1;
    if (!a.is_top && b.is_top) return 1;
    return 0;
  });

  const allSpecs = Array.from(
    new Set(barbers.flatMap((b) => b.specializations || []))
  ).sort();

  const filteredBarbers = selectedSpec
    ? sortedBarbers.filter((b) => (b.specializations || []).includes(selectedSpec))
    : sortedBarbers;

  const handleMasterClick = (barber: Barber) => {
    onMasterClick?.(barber);
  };

  return (
    <section id="team" className="py-20 px-4 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Наша команда
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Профессиональные барберы с многолетним опытом. Выберите мастера и запишитесь онлайн.
          </p>
        </div>

        {allSpecs.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedSpec(null)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedSpec === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Все мастера
            </button>
            {allSpecs.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSpec === spec
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBarbers.map((barber) => (
            <div
              key={barber.id}
              onClick={() => handleMasterClick(barber)}
              className="cursor-pointer"
            >
              <MasterCard
                barber={barber}
                status={getEffectiveStatus(barber)}
                lastUpdated={lastUpdated}
                onBook={onBook}
              />
            </div>
          ))}
        </div>

        {filteredBarbers.length === 0 && (
          <div className="text-center text-gray-400 text-xl py-12">
            {barbers.length === 0 ? 'Мастера скоро будут добавлены' : 'Мастера не найдены'}
          </div>
        )}
      </div>
    </section>
  );
}