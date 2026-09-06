// === СТАТУСЫ ЗАГРУЗКИ МАСТЕРА ===
export enum MasterLoadStatus {
  IMMEDIATE = 'IMMEDIATE',           // 🟢 Окна в ближайшие 2 часа
  TODAY = 'TODAY',                   // 🟡 Окна сегодня, но позже
  TOMORROW = 'TOMORROW',             // 🔵 Сегодня всё, есть завтра
  IN_2_DAYS = 'IN_2_DAYS',           // 🔵 Запись на послезавтра
  IN_3_4_DAYS = 'IN_3_4_DAYS',       // ⚪ Высокая загрузка (3-4 дня)
  FULLY_BOOKED = 'FULLY_BOOKED',     // 🔴 Полная запись (нет мест)
  MANUAL_OVERRIDE = 'MANUAL_OVERRIDE' // 🟣 Ручной статус от админа
}

// === ПОРТФОЛИО МАСТЕРА ===
export interface PortfolioItem {
  id: string;
  url: string;       // Ссылка на фото (GitHub CDN / jsDelivr)
  title: string;     // Название работы: "Классический фейд"
  tags?: string[];    // Теги: ["Фейд", "Короткая"]
}

// === МАСТЕР (БАРБЕР) ===
export interface Barber {
  // --- Основные данные ---
  id: string;                    // Внутренний ID (например, 'barber-1')
  yclients_staff_id: number;     // ID из YClients (например, 5772390)
  name: string;                  // Имя и фамилия
  role: string;                  // "Топ-барбер", "Барбер", "Старший барбер"
  photo_url: string;             // Ссылка на главное фото
  
  // --- Специализации и описание ---
  specializations: string[];     // Теги: ["Фейды", "Бороды", "Камуфляж"]
  bio: string;                   // Подробное описание (2-4 предложения)
  services: string[];            // Список услуг: ["Мужская стрижка", "Борода"]
  
  // --- Портфолио ---
  portfolio: PortfolioItem[];    // 6-7 работ мастера
  
  // --- Рейтинг и отзывы ---
  rating: number;                // 0.0 - 5.0 (ручной ввод)
  reviewsCount: number;          // Количество отзывов
  
  // --- Флаги ---
  is_top: boolean;               // Показывать первым (ТОП)
  is_active: boolean;            // Отображается на сайте
  
  // --- Статус загрузки ---
  manual_status?: MasterLoadStatus | null;  // Ручной override от админа
}

// === ДАННЫЕ ДЛЯ СИНХРОНИЗАЦИИ СТАТУСОВ ===
export interface MasterStatusData {
  staff_id: number;
  status: MasterLoadStatus;
  slots_count: number;
  next_available: string | null;
}

export interface YClientsResponse {
  success: boolean;
  data: MasterStatusData[];
  timestamp: string;
}

// === АДМИН ПОЛЬЗОВАТЕЛЬ ===
export interface AdminUser {
  username: string;
  password_hash: string;
  role: 'admin' | 'viewer';
}

// === КОНФИГУРАЦИЯ GITHUB CDN ===
export const GITHUB_CONFIG = {
  repo: 'barbershop-images',
  owner: 'akane-coder',
  branch: 'main',
  cdnBase: 'https://cdn.jsdelivr.net/gh',
};

export function getImageUrl(path: string): string {
  return `${GITHUB_CONFIG.cdnBase}/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}@${GITHUB_CONFIG.branch}/${path}`;
}

// === ПРЕДУСТАНОВЛЕННЫЕ УСЛУГИ (для админки) ===
export const DEFAULT_SERVICES = [
  'Мужская стрижка',
  'Стрижка бороды',
  'Королевское бритьё',
  'Камуфляж седины',
  'Детская стрижка',
  'Комплекс (стрижка + борода)',
  'Укладка',
  'Дизайн бороды',
];

// === СПРАВОЧНИК УСЛУГ (реальные данные из YClients) ===
export interface ServiceInfo {
  name: string;
  duration: string;
  price: string;
  description?: string;
}

export const AVAILABLE_SERVICES: ServiceInfo[] = [
  {
    name: 'Стрижка головы',
    duration: '1 ч',
    price: '40 BYN',
    description: 'Профессиональная стрижка с учетом ваших предпочтений и анатомических особенностей.',
  },
  {
    name: 'Удлинённая стрижка',
    duration: '1 ч',
    price: '40 BYN',
    description: 'Удлинённые дизайны стрижек, актуальная длина волос по всей окружности головы от 10 см.',
  },
  {
    name: 'Стрижка машинкой',
    duration: '1 ч',
    price: '35 BYN',
    description: 'Стрижка машинкой — идеально подходит для свежего и уходового образа.',
  },
  {
    name: 'Стрижка комплекс (голова + борода)',
    duration: '2 ч',
    price: '55 BYN',
    description: 'Совместная стрижка головы и оформления бороды — гармоничный и ухоженный образ.',
  },
  {
    name: 'Детская стрижка (5-12 лет)',
    duration: '1 ч',
    price: '35 BYN',
    description: 'Компетентное и бережное обслуживание для маленьких клиентов.',
  },
  {
    name: 'Стрижка папа+сын (5-12 лет)',
    duration: '2 ч',
    price: '70 BYN',
    description: 'Совместная стрижка для семьи — стильное решение, объединяющее папу и ребенка.',
  },
  {
    name: 'Стрижка бро+бро',
    duration: '2 ч',
    price: '75 BYN',
    description: 'Мужская стрижка для друзей или коллег. Стильное решение для тех, кто ценит ухоженный вид.',
  },
  {
    name: 'Стрижка бороды',
    duration: '1 ч',
    price: '30 BYN',
    description: 'Формирование и моделирование бороды и усов: аккуратные линии, четкий контур.',
  },
];

// Только названия — для автодополнения в админке
export const SERVICE_NAMES = AVAILABLE_SERVICES.map(s => s.name);

// === ПРЕДУСТАНОВЛЕННЫЕ СПЕЦИАЛИЗАЦИИ ===
export const DEFAULT_SPECIALIZATIONS = [
  'Фейды',
  'Бороды',
  'Камуфляж',
  'Короткие стрижки',
  'Классика',
  'Детские стрижки',
  'Бритьё опасной бритвой',
  'Длинные волосы',
];