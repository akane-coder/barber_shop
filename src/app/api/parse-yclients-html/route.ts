import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const ORGANIZATION_ID = 262700;

export async function POST(req: Request) {
  try {
    const { staffIds } = await req.json();
    
    // Загружаем страницу со списком мастеров
    const response = await fetch(
      `https://b270235.yclients.com/company/${ORGANIZATION_ID}/personal/select-master`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results = staffIds.map((staffId: number) => {
      // Ищем мастера по data-locator или другому атрибуту
      const masterElement = $(`[data-locator*="master_container_${staffId}"]`).first();
      
      let status = 'FULLY_BOOKED';
      
      if (masterElement.length > 0) {
        // Проверяем есть ли текст "свободен" или "запись"
        const text = masterElement.text().toLowerCase();
        
        if (text.includes('свободен') || text.includes('сейчас')) {
          status = 'IMMEDIATE';
        } else if (text.includes('сегодня')) {
          status = 'TODAY';
        } else if (text.includes('завтра')) {
          status = 'TOMORROW';
        } else if (!text.includes('полная запись')) {
          status = 'IN_2_DAYS';
        }
      }
      
      return {
        staff_id: staffId,
        status,
        source: 'html_parsed',
      };
    });
    
    return NextResponse.json({
      success: true,
      data: results,
      source: 'html_fallback',
    });
    
  } catch (error) {
    console.error('HTML parsing error:', error);
    return NextResponse.json({ error: 'HTML parsing failed' }, { status: 500 });
  }
}