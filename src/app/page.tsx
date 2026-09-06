'use client';
import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import TeamSection from './components/TeamSection';
import ServicesSection from './components/ServicesSection';
import ContactSection from './components/ContactSection';
import YClientsWidget from './components/YClientsWidget';
import { Barber, MasterLoadStatus, MasterStatusData } from '@/types';
import { trackVisit, trackMasterClick, trackBookClick, trackYClientsOpen } from '@/lib/analytics';

export default function Home() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [parsedStatuses, setParsedStatuses] = useState<Record<number, MasterStatusData>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadBarbers();
    loadParsedStatuses();
    trackVisit();
  }, []);

  const loadBarbers = async () => {
    try {
      const res = await fetch('/api/admin/barbers');
      if (res.ok) {
        const data = await res.json();
        setBarbers(data.filter((b: Barber) => b.is_active));
      }
    } catch (err) {
      console.error('Ошибка загрузки мастеров:', err);
    }
  };

  const loadParsedStatuses = async () => {
    try {
      const res = await fetch('/api/admin/parsed-statuses');
      if (res.ok) {
        const data = await res.json();
        setParsedStatuses(data.statuses || {});
        setLastUpdated(data.timestamp || '');
      }
    } catch (err) {
      console.error('Ошибка загрузки статусов:', err);
    }
  };

  const getEffectiveStatus = (barber: Barber): MasterLoadStatus | null => {
    if (barber.manual_status) {
      return barber.manual_status;
    }
    const parsed = parsedStatuses[barber.yclients_staff_id];
    if (parsed) {
      return parsed.status as MasterLoadStatus;
    }
    return null;
  };

  const handleBook = (barber?: Barber) => {
    setSelectedBarber(barber || null);
    setIsWidgetOpen(true);
    trackBookClick();
  };

  const handleCloseWidget = () => {
    setIsWidgetOpen(false);
    setSelectedBarber(null);
  };

  const handleMasterClick = (barber: Barber) => {
    trackMasterClick(barber.id, barber.name);
  };

  const handleWidgetOpen = () => {
    trackYClientsOpen();
  };

  return (
    <main className="bg-gray-900 min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">Дядюшка Ру</div>
          <div className="hidden md:flex gap-8">
            <a href="#team" className="text-gray-300 hover:text-white transition-colors">
              Мастера
            </a>
            <a href="#services" className="text-gray-300 hover:text-white transition-colors">
              Услуги
            </a>
            <a href="#contacts" className="text-gray-300 hover:text-white transition-colors">
              Контакты
            </a>
          </div>
          <button
            onClick={() => handleBook()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Записаться
          </button>
        </div>
      </nav>

      <Hero onBook={() => handleBook()} />
      
      <TeamSection
        barbers={barbers}
        getEffectiveStatus={getEffectiveStatus}
        lastUpdated={lastUpdated}
        onBook={handleBook}
        onMasterClick={handleMasterClick}
      />
      
      <ServicesSection />
      <ContactSection />

      <footer className="bg-gray-950 py-8 px-4 text-center text-gray-500">
        <p>© 2024 Дядюшка Ру. Все права защищены.</p>
      </footer>

      <YClientsWidget
        barber={selectedBarber}
        isOpen={isWidgetOpen}
        onClose={handleCloseWidget}
        onOpen={handleWidgetOpen}
      />
    </main>
  );
}