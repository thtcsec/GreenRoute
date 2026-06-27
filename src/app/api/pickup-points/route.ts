import { NextResponse, NextRequest } from 'next/server';
import pickupPointsData from '@/data/pickup_points.json';
import { PickupPoints } from '@/types';

// In-memory store cho pickup points
// (Do pickup points hiện tại lưu object thay vì array)
let pickupPoints: PickupPoints = { ...pickupPointsData } as PickupPoints;

export async function GET() {
  return NextResponse.json(pickupPoints);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // API POST này dùng để thay thế suggestedPoint hoặc defaultPoint 
    // trong ngữ cảnh MVP (có thể mở rộng thành mảng nếu cần ở Phase sau)
    
    if (body.type === 'default' && body.point) {
      pickupPoints.defaultPoint = body.point;
    } else if (body.type === 'suggested' && body.point) {
      pickupPoints.suggestedPoint = body.point;
    } else {
      return NextResponse.json({ error: 'Invalid payload. Need type (default/suggested) and point.' }, { status: 400 });
    }

    return NextResponse.json(pickupPoints, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
