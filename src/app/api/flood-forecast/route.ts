import { NextResponse, NextRequest } from 'next/server';
import { FloodForecastData } from '@/types';
import floodRisksData from '@/data/flood_risks.json';

// Cache route trong 5 phút
export const revalidate = 300;

const GOOGLE_FLOOD_API_URL = 'https://floodforecasting.googleapis.com/v1';

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_FLOOD_API_KEY;

  if (!apiKey || apiKey === 'your_google_flood_api_key_here') {
    // Fallback: Sử dụng dữ liệu tĩnh khi chưa có API key
    return NextResponse.json(getFallbackFloodData());
  }

  try {
    // Framework integration-ready:
    // 1. Lấy trạng thái ngập lụt hiện tại (Ví dụ gọi searchLatestFloodStatusByArea)
    // 2. Lấy dữ liệu các trạm đo nước (gauges)
    // 3. Lấy vùng ngập polygon

    // NOTE: Các endpoint dưới đây yêu cầu dự án Google Cloud được cấp quyền truy cập Flood API.
    const [floodStatusRes, gaugesRes] = await Promise.all([
      fetch(`${GOOGLE_FLOOD_API_URL}/floodStatus:searchLatestFloodStatusByArea?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Giả lập bounding box khu vực Thủ Đức
          viewport: {
            low: { latitude: 10.85, longitude: 106.75 },
            high: { latitude: 10.90, longitude: 106.85 }
          }
        }),
        next: { revalidate: 300 }
      }),
      fetch(`${GOOGLE_FLOOD_API_URL}/gauges:searchGaugesByArea?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewport: {
            low: { latitude: 10.85, longitude: 106.75 },
            high: { latitude: 10.90, longitude: 106.85 }
          }
        }),
        next: { revalidate: 3600 }
      })
    ]);

    if (!floodStatusRes.ok || !gaugesRes.ok) {
      console.warn('Google Flood API trả về lỗi, fallback sang dữ liệu tĩnh.');
      return NextResponse.json(getFallbackFloodData());
    }

    const floodStatus = await floodStatusRes.json();
    const gauges = await gaugesRes.json();

    const responseData: FloodForecastData = {
      source: 'google-flood-api',
      status: 'success',
      // Map data từ Google API structure sang nội bộ
      polygons: floodStatus.statusRecords?.map((record: any) => record.polygons) || [],
      gauges: gauges.gauges?.map((g: any) => ({
        id: g.name,
        name: g.gaugeId,
        waterLevel: g.latestWaterLevel || 0,
        lat: g.location?.latitude || 0,
        lng: g.location?.longitude || 0,
      })) || [],
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Lỗi khi gọi Google Flood API:', error);
    return NextResponse.json(getFallbackFloodData());
  }
}

function getFallbackFloodData(): FloodForecastData {
  return {
    source: 'static',
    status: 'fallback',
    gauges: floodRisksData.map(risk => ({
      id: risk.id,
      name: risk.name,
      waterLevel: risk.waterDepth, // Dùng waterDepth giả làm waterLevel
      lat: risk.lat,
      lng: risk.lng,
    })),
  };
}
