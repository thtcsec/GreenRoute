import { NextResponse, NextRequest } from 'next/server';
import { ClimateReport } from '@/types';

// In-memory store (chỉ dùng cho hackathon/MVP)
const reports: ClimateReport[] = [];

export async function GET() {
  // Trả về danh sách report mới nhất trước (sort by timestamp descending)
  const sortedReports = [...reports].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return NextResponse.json(sortedReports);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation cơ bản
    if (!body.type || !body.lat || !body.lng) {
      return NextResponse.json({ error: 'Missing required fields: type, lat, lng' }, { status: 400 });
    }

    const newReport: ClimateReport = {
      id: `report-${Date.now()}`,
      type: body.type,
      lat: body.lat,
      lng: body.lng,
      note: body.note || '',
      timestamp: new Date().toISOString()
    };

    // Thêm vào store in-memory
    reports.push(newReport);

    return NextResponse.json(newReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
