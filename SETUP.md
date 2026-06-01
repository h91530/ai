# YOLO 객체 인식 웹사이트 설정

## 📋 프로젝트 구조

```
yolo/
├── app/
│   ├── page.tsx              # 메인 홈페이지 UI
│   └── api/
│       └── detect/
│           └── route.ts      # 이미지 검출 API 엔드포인트
├── models/                    # YOLO 모델 파일 저장 위치
│   └── yolo26n.pt            # YOLO 나노 모델 (넣어야 함)
├── scripts/
│   └── detect.py             # Python YOLO 인식 스크립트
├── tmp/                       # 임시 이미지 저장 위치
└── package.json
```

## 🚀 시작하기

### 1. YOLO 모델 설정
`models/` 디렉토리에 `yolo26n.pt` 파일을 놓으세요.

### 2. Python 의존성 설치
```bash
pip install torch torchvision ultralytics pillow
```

### 3. 개발 서버 시작
```bash
npm run dev
```

서버는 `http://localhost:3000` 에서 실행됩니다.

## 💻 사용 방법

1. 웹사이트 열기: http://localhost:3000
2. 이미지 업로드 섹션에서 이미지 클릭 또는 드래그
3. 자동으로 YOLO 모델이 이미지를 분석
4. 인식된 객체와 신뢰도(%) 표시

## 🔧 기술 스택

- **프론트엔드**: Next.js 16.2.6 + React 19.2.4 + Tailwind CSS 4
- **백엔드**: Next.js API Routes (TypeScript)
- **인식 엔진**: YOLO (Ultralytics)
- **Python**: 3.12+

## 📝 주요 파일 설명

### `app/page.tsx`
- 이미지 업로드 UI 제공
- 실시간 로딩 상태 표시
- 인식 결과 목록 표시 (객체명, 신뢰도)

### `app/api/detect/route.ts`
- FormData로 받은 이미지 처리
- Python 스크립트 실행
- JSON 형식의 검출 결과 반환

### `scripts/detect.py`
- YOLO 모델 로드
- 이미지 인식 수행
- JSON으로 결과 저장

## 🐛 문제 해결

### Python 스크립트 실행 안 될 때
- Python이 PATH에 있는지 확인
- `python --version` 으로 확인

### 모델 로드 실패
- `models/yolo26n.pt` 파일이 존재하는지 확인
- PyTorch가 제대로 설치되었는지 확인: `pip install torch -U`

### 이미지 업로드 안 될 때
- 브라우저 콘솔에서 에러 확인
- API 응답 상태 확인: F12 개발자 도구 > Network 탭

## 📦 배포

프로덕션 배포:
```bash
npm run build
npm start
```

## 🎨 커스터마이징

### 모델 변경
`scripts/detect.py` 의 모델 로드 부분 수정:
```python
model = YOLO('models/yolo8n.pt')  # 다른 모델 사용
```

### UI 스타일
`app/page.tsx` 의 Tailwind 클래스 수정

### 신뢰도 필터링
`scripts/detect.py` 에 필터링 로직 추가:
```python
if float(conf) > 0.5:  # 신뢰도 50% 이상만
    detections.append(...)
```
