import { NextRequest, NextResponse } from 'next/server';

// 라이트세일 YOLO API 주소 (환경변수로 덮어쓸 수 있음)
const DETECT_API_URL =
  process.env.DETECT_API_URL || 'https://yangti.shop/python/detect';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 업로드된 파일을 그대로 라이트세일 API로 전달 (서버→서버, CORS 무관)
    const forwardData = new FormData();
    forwardData.append('file', file, 'image.jpg');

    const response = await fetch(DETECT_API_URL, {
      method: 'POST',
      body: forwardData,
    });

    if (!response.ok) {
      throw new Error(`감지 서버 오류 (${response.status})`);
    }

    const data = await response.json();

    return NextResponse.json({
      detections: data.detections || [],
      image: data.image || null,
    });
  } catch (error) {
    console.error('Detection error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        detections: [],
      },
      { status: 500 }
    );
  }
}
