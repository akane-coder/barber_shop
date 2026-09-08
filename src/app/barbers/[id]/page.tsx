import { Barber } from '@/types';
import { AVAILABLE_SERVICES } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData } from '@/lib/kv';

const YCLIENTS_COMPANY_ID = 262700;
const YCLIENTS_BASE_URL = `https://b270235.yclients.com/company/${YCLIENTS_COMPANY_ID}`;

// Получение данных из KV
async function getBarbersFromKV(): Promise<Barber[]> {
  try {
    const barbers = await getData<Barber[]>('barbers_data');
    return Array.isArray(barbers) ? barbers : [];
  } catch (error) {
    console.error('Error reading barbers from KV:', error);
    return [];
  }
}

// Генерация статических путей для всех активных мастеров
export async function generateStaticParams() {
  const barbers = await getBarbersFromKV();
  return barbers
    .filter((b) => b.is_active)
    .map((barber) => ({ id: barber.id }));
}

// Server Component — params это Promise в Next.js 15+
export default async function BarberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const barbers = await getBarbersFromKV();
  const barber = barbers.find((b) => b.id === id);

  if (!barber || !barber.is_active) {
    notFound();
  }

  // ИСПРАВЛЕНО: теперь ведёт на select-master с параметром o=m{STAFF_ID}
  const bookingUrl = `${YCLIENTS_BASE_URL}/personal/select-master?o=m${barber.yclients_staff_id}`;

  // Сопоставление услуг мастера со справочником
  const barberServices = (barber.services || []).map((serviceName) => {
    const found = AVAILABLE_SERVICES.find(
      (s) => s.name === serviceName || serviceName.includes(s.name)
    );
    return {
      name: found ? found.name : serviceName,
      duration: found?.duration || 'Уточняйте',
      price: found?.price || 'По запросу',
      description: found?.description,
    };
  });

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* === НАВИГАЦИЯ (чистый фон без blur) === */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-lg md:text-xl font-bold text-white hover:text-blue-400 transition flex items-center gap-2">
            <span className="text-2xl">←</span>
            <span>На главную</span>
          </Link>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            Записаться онлайн
          </a>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        {/* === ШАПКА ПРОФИЛЯ (без градиентов) === */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gray-700 bg-gray-800">
              <Image
                src={barber.photo_url || 'https://via.placeholder.com/400x400?text=No+Photo'}
                alt={barber.name}
                fill
                className="object-cover"
                sizes="400px"
                priority
              />
              {barber.is_top && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
                  ТОП-БАРБЕР
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{barber.name}</h1>
            <p className="text-xl text-blue-400 mb-4">{barber.role}</p>
            {/* Рейтинг */}
            {(barber.rating || 0) > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(barber.rating || 0) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="text-gray-400 text-sm">
                  {(barber.rating || 0).toFixed(1)}
                  {barber.reviewsCount > 0 && ` (${barber.reviewsCount} отзывов)`}
                </span>
              </div>
            )}
            {/* Специализации */}
            {barber.specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {barber.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
            {/* Био */}
            <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
              {barber.bio || 'Описание мастера скоро будет добавлено.'}
            </p>
          </div>
        </div>

        {/* === УСЛУГИ (чистые карточки без градиентов) === */}
        {barberServices.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 border-l-4 border-blue-600 pl-4">
              Услуги и цены
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {barberServices.map((service, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 p-5 rounded-xl border border-gray-700"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                    <div className="text-xl font-bold text-blue-400 whitespace-nowrap">
                      {service.price}
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{service.duration}</p>
                  {service.description && (
                    <p className="text-gray-500 text-xs mt-2">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === ПОРТФОЛИО (без оверлеев) === */}
        {barber.portfolio && barber.portfolio.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 border-l-4 border-blue-600 pl-4">
              Портфолио работ
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {barber.portfolio.map((item) => (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-800 bg-gray-800"
                >
                  <Image
                    src={item.url}
                    alt={item.title || 'Работа мастера'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === CTA БЛОК (чистый фон) === */}
        <div className="bg-gray-800 rounded-2xl p-8 md:p-10 text-center border border-gray-700">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Готовы к преображению?</h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Запишитесь к {barber.name} прямо сейчас через удобную систему онлайн-записи.
          </p>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-colors"
          >
            Записаться к мастеру
          </a>
        </div>
      </div>

      {/* Футер */}
      <footer className="border-t border-gray-800 py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Дядюшка Ру. Все права защищены.
      </footer>
    </main>
  );
}