// scripts/test-yclients.js

async function testYClientsDirect() {
  const companyId = 262700; // Из твоих данных
  const staffIds = [5772390, 5565501]; // ID мастеров
  const today = new Date().toISOString().split('T')[0]; // Формат YYYY-MM-DD

  console.log('🔍 Прямой запрос к публичному API YClients...');
  console.log('📅 Дата для проверки:', today);

  for (const staffId of staffIds) {
    console.log(`\n--- Проверка мастера ${staffId} ---`);
    try {
      // Используем GET-запрос с date в query-параметрах (стандарт для виджета YClients)
      const url = `https://b270235.yclients.com/api/v1/company/${companyId}/staff/${staffId}/slots?date=${today}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // Эмулируем обычный браузер, чтобы YClients не блокировал запрос как бота
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const data = await response.json();
      
      console.log('📡 Статус HTTP:', response.status);
      
      if (data.success && data.data) {
        console.log(`✅ Успех! Найдено слотов: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log('🕒 Первый доступный слот:', data.data[0].start_time);
        }
      } else {
        console.log('⚠️ Ответ получен, но массив слотов пуст или имеет другую структуру.');
        console.log('📄 Сырой ответ (первые 200 символов):', JSON.stringify(data).substring(0, 200));
      }
    } catch (error) {
      console.error('❌ Ошибка сети:', error.message);
    }
  }
}

testYClientsDirect();