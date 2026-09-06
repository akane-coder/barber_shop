import { AVAILABLE_SERVICES } from '@/types';

// Маппинг услуг к иконкам (эмодзи — бесплатно и без зависимостей)
const SERVICE_ICONS: Record<string, string> = {
  'Стрижка головы': '✂️',
  'Удлинённая стрижка': '💇‍♂️',
  'Стрижка машинкой': '⚡',
  'Стрижка комплекс': '🎯',
  'Детская стрижка': '',
  'Стрижка папа+сын': '👨‍👦',
  'Стрижка бро+бро': '',
  'Стрижка бороды': '🧔',
};

// Маппинг услуг к описаниям (если нет в AVAILABLE_SERVICES)
const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Стрижка головы': 'Классическая или модельная стрижка с учётом формы лица и структуры волос',
  'Удлинённая стрижка': 'Работа с длинными волосами — текстура, объём, стиль',
  'Стрижка машинкой': 'Чёткие линии, фейды, андеркаты — быстро и аккуратно',
  'Стрижка комплекс': 'Полный образ: голова + борода в одном визите',
  'Детская стрижка': 'Бережный подход к маленьким клиентам, уютная атмосфера',
  'Стрижка папа+сын': 'Семейный формат — стиль для двоих со скидкой',
  'Стрижка бро+бро': 'Для друзей или коллег — стильное решение вместе',
  'Стрижка бороды': 'Моделирование формы, чёткий контур, уход за бородой',
};

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 px-4 bg-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* === ЗАГОЛОВОК СЕКЦИИ === */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Услуги и цены
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Прозрачное ценообразование без скрытых платежей.
            Все услуги выполняются мастерами-профессионалами.
          </p>
        </div>

        {/* === СЕТКА УСЛУГ (2 колонки на десктопе) === */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {AVAILABLE_SERVICES.map((service) => {
            const icon = SERVICE_ICONS[service.name] || '️';
            const description =
              service.description || SERVICE_DESCRIPTIONS[service.name] || '';

            return (
              <div
                key={service.name}
                className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  {/* Иконка */}
                  <div className="text-3xl shrink-0 group-hover:scale-110 transition-transform">
                    {icon}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {service.name}
                      </h3>
                      <div className="text-xl font-bold text-blue-400 whitespace-nowrap">
                        {service.price}
                      </div>
                    </div>

                    {/* Длительность */}
                    <div className="flex items-center gap-1 text-gray-400 text-sm mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{service.duration}</span>
                    </div>

                    {/* Описание */}
                    {description && (
                      <p className="text-gray-500 text-sm leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === CTA БЛОК В КОНЦЕ СЕКЦИИ === */}
        <div className="bg-gray-800 rounded-2xl p-8 md:p-10 text-center border border-gray-700">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Привлекли наши работы?
            </h3>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                Запишитесь онлайн и выберите удобное время визита.
                Наши мастера помогут подобрать идеальный образ.
            </p>
            <a
                href="https://b270235.yclients.com/company/262700"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition-colors"
            >
                Записаться онлайн
            </a>
        </div>
      </div>
    </section>
  );
}