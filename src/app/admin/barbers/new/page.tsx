'use client';

import BarberForm from '@/app/admin/barber-form';

export default function NewBarberPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => window.history.back()} 
          className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Назад к списку
        </button>
        <BarberForm />
      </div>
    </div>
  );
}