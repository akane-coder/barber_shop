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
              <p className="text-gray-400">Пн-Пт: 10:00 - 21:00</p>
              <p className="text-gray-400">Сб-Вс: 10:00 - 20:00</p>
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
          <div className="bg-gray-800 rounded-lg overflow-hidden h-80">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2398.1234567890123!2d29.1951656!3d53.1702103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46d731675645d9bd%3A0xfdfbdb9bc50a4e5!2z0YPQuy4gNTAg0LXQvdC70Ywg0JLQsNCy0LXRgNC10YHQvdCx0LXQvdGMLCAxMCwg0JHQvtCx0LDQvdGMLCAyMTM4MTA!5e0!3m2!1sru!2sby!4v1234567890123!5m2!1sru!2sby"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Карта - Дядюшка Ру"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}