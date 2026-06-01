'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface Detection {
  class: string;
  confidence: number;
  box: [number, number, number, number];
}

const SAMPLE_IMAGES: Record<string, string> = {
  '사람': 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600',
  '고양이': 'https://images.pexels.com/photos/1870376/pexels-photo-1870376.jpeg?auto=compress&cs=tinysrgb&w=600',
  '자동차': 'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=600',
};

const SAMPLES = [
  { id: 1, name: '사람' },
  { id: 3, name: '고양이' },
  { id: 4, name: '자동차' },
];

// 종류별 한국어 단위
const ANIMALS = ['고양이', '강아지', '말', '양', '소', '코끼리', '곰', '얼룩말', '기린', '새'];
const VEHICLES = ['자동차', '버스', '트럭', '오토바이', '자전거', '기차', '비행기', '보트'];

function counterUnit(name: string): string {
  if (name === '사람') return '명';
  if (ANIMALS.includes(name)) return '마리';
  if (VEHICLES.includes(name)) return '대';
  return '개';
}

function summarize(detections: Detection[]): { name: string; count: number; unit: string }[] {
  const map = new Map<string, number>();
  for (const d of detections) {
    map.set(d.class, (map.get(d.class) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count, unit: counterUnit(name) }))
    .sort((a, b) => b.count - a.count);
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleSampleClick = async (sampleType: string) => {
    try {
      const imageUrl = SAMPLE_IMAGES[sampleType];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
      await processFile(file);
    } catch (err) {
      setError('샘플 이미지 로드 실패');
    }
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      await detectObjects(file);
    };
    reader.readAsDataURL(file);
  };

  const detectObjects = async (file: File) => {
    setLoading(true);
    setError(null);
    setDetections(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('인식 실패');
      }

      const data = await response.json();
      setDetections(data.detections);
      setProcessedImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    }
  };

  const resetUpload = () => {
    setImage(null);
    setProcessedImage(null);
    setDetections(null);
    setError(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#000000' }}>
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '56px', height: '56px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid #ffffff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#ffffff', fontSize: '17px', fontWeight: 500, margin: 0 }}>인식 중입니다</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <main style={{ maxWidth: '1300px', margin: '0 auto', padding: '48px 32px' }}>
        {/* 페이지 제목 */}
        <h1 style={{ fontSize: '34px', fontWeight: 700, margin: '0 0 24px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          이미지 객체 인식
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '40px' }}>

          {/* Left - Upload */}
          <section>
            <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 16px' }}>업로드</h2>

            {/* 프로젝트 설명 */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '15px', color: '#555555', lineHeight: 1.7, margin: '0 0 20px' }}>
                이미지를 올리면 AI가 사진 속 객체를 자동으로 찾아내 위치를 표시하고,
                종류별 개수를 통계로 보여줍니다.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { step: '1', title: '이미지 업로드', desc: '파일을 선택하거나 끌어다 놓으세요. 샘플 이미지로도 바로 테스트할 수 있어요.' },
                  { step: '2', title: '자동 분석', desc: 'AI가 사진을 분석해 객체를 찾고 박스로 위치를 표시합니다.' },
                  { step: '3', title: '결과 확인', desc: '감지된 객체와 정확도, 종류별 개수 통계를 확인하세요.' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ flexShrink: 0, width: '30px', height: '30px', border: '1px solid #000000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                      {s.step}
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 4px' }}>{s.title}</p>
                      <p style={{ fontSize: '14px', color: '#777777', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                border: '2px dashed #cccccc',
                padding: '64px 24px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <p style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 6px' }}>이미지 업로드</p>
              <p style={{ color: '#888888', fontSize: '15px', margin: 0 }}>클릭하거나 파일을 끌어다 놓으세요</p>
            </div>

            {error && (
              <div style={{ marginTop: '20px', padding: '14px 18px', backgroundColor: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', fontSize: '15px' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '36px' }}>
              <p style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 16px' }}>샘플 이미지</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {SAMPLES.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSampleClick(sample.name)}
                    style={{ cursor: 'pointer', border: '1px solid #e0e0e0' }}
                  >
                    <img src={SAMPLE_IMAGES[sample.name]} alt={sample.name} style={{ width: '100%', height: '170px', objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: 500 }}>
                      {sample.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right - Results */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>결과</h2>
              {image && (
                <button
                  onClick={resetUpload}
                  style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '15px' }}
                >
                  초기화
                </button>
              )}
            </div>

            {image ? (
              <div>
                <div style={{ position: 'relative', width: '100%', height: '600px', backgroundColor: '#000000', overflow: 'hidden' }}>
                  <Image src={processedImage || image} alt="result" fill style={{ objectFit: 'contain' }} />
                </div>

                {detections && detections.length > 0 ? (
                  <div style={{ marginTop: '24px' }}>
                    {/* 통계 요약 */}
                    <p style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 14px' }}>통계</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
                      {summarize(detections).map((s) => (
                        <div key={s.name} style={{ border: '1px solid #e0e0e0', padding: '14px 18px', minWidth: '110px' }}>
                          <div style={{ fontSize: '15px', color: '#888888', marginBottom: '6px' }}>{s.name}</div>
                          <div style={{ fontSize: '24px', fontWeight: 700 }}>{s.count}<span style={{ fontSize: '16px', fontWeight: 500, marginLeft: '2px' }}>{s.unit}</span></div>
                        </div>
                      ))}
                    </div>

                    {/* 상세 목록 */}
                    <p style={{ fontSize: '17px', fontWeight: 600, margin: '0 0 14px' }}>감지된 객체 {detections.length}개</p>
                    {detections.map((detection, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eeeeee', fontSize: '16px' }}>
                        <span style={{ fontWeight: 500 }}>{detection.class}</span>
                        <span style={{ color: '#888888' }}>{(detection.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                ) : detections !== null ? (
                  <div style={{ marginTop: '24px', textAlign: 'center', color: '#888888', fontSize: '16px' }}>감지된 객체가 없습니다</div>
                ) : (
                  <div style={{ marginTop: '24px', textAlign: 'center', color: '#888888', fontSize: '16px' }}>분석 중...</div>
                )}
              </div>
            ) : (
              <div style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e0e0', color: '#aaaaaa', fontSize: '16px' }}>
                이미지를 업로드하면 결과가 표시됩니다
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
