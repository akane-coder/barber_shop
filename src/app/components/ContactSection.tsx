export default function ContactSection() {
  return (
    <section id="contacts" className="py-20 px-4 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Контакты
          </h2>
          <p className="text-gray-400 text-lg">
            Мы всегда рады видеть вас
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Информация */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Адрес</h3>
              <p className="text-gray-400">г. Бобруйск ул. 50 лет ВЛКСМ д.10</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Телефон</h3>
              <p className="text-gray-400">+375 (44) 764-91-91</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Режим работы</h3>
              <p className="text-gray-400">Ежедневно: 10:00 - 21:00</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Соцсети</h3>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/bobruisk_uncle?stkn=MXMyaGN3OTgwNzY3NQ==" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Instagram
                </a>
                <a href="https://vk.com/bobruisk_uncle" className="text-gray-400 hover:text-blue-400 transition-colors">
                  VK
                </a>
              </div>
            </div>
          </div>
          
          {/* Карта - ИСПРАВЛЕНО */}
          <div className="bg-gray-800 rounded-lg overflow-hidden h-80 w-full">
            <iframe
              src="https://www.google.com/maps?q=53.1701693,29.1971607&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта - Барбершоп Дядюшка Ру"
              className="grayscale hover:grayscale-0 transition-all duration-500" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}