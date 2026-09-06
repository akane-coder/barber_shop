'use client';

import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-white">
        <h1 className="text-2xl font-bold text-center mb-6">
          Панель управления
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition"
          >
            Вход для администратора
          </button>
          
          <button
            onClick={() => router.push('/admin/login?role=viewer')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition"
          >
            Вход для сотрудника (просмотр)
          </button>
          
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-400 hover:text-white py-2 text-sm"
            >
              ← Вернуться на сайт
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}