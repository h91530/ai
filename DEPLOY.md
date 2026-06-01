# 배포 가이드 (분리 방식)

```
Vercel (Next.js 화면)  →  라이트세일 (Python YOLO API)
                           https://yangti.shop/python/detect
```

- **Vercel**: Next.js 프론트 (무료)
- **라이트세일**: FastAPI로 YOLO만 실행

---

# A. 라이트세일 (Python API) 배포

## 1. SSH 접속
라이트세일 콘솔 → 인스턴스 → 터미널(SSH)

## 2. 패키지 + 한글 폰트 설치
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git fonts-nanum nginx
```
> `fonts-nanum` = 한글 라벨 깨짐 방지 (필수)

## 3. 코드 받기
```bash
cd ~
git clone https://github.com/본인아이디/본인저장소.git yolo
cd yolo
```

## 4. Python 라이브러리 설치
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```
> torch 때문에 3~4GB, 몇 분 걸립니다.

## 5. API 서버 실행 테스트
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```
다른 터미널에서 확인:
```bash
curl http://localhost:8000/        # {"status":"ok"} 나오면 성공
```
확인됐으면 Ctrl+C로 끄고 6번으로.

## 6. 계속 켜두기 (pm2 또는 systemd)
**pm2 방식 (간단):**
```bash
sudo apt install -y npm
sudo npm install -g pm2
pm2 start "venv/bin/uvicorn server:app --host 0.0.0.0 --port 8000" --name yolo-api
pm2 save
pm2 startup   # 출력되는 명령어 한 줄 복사 실행
```

## 7. nginx로 /python 경로 연결
`https://yangti.shop/python/detect` → 내부 8000 포트로 프록시.

```bash
sudo nano /etc/nginx/sites-available/default
```
`server { ... }` 안에 추가:
```nginx
location /python/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
    client_max_body_size 20M;     # 이미지 업로드 크기 허용
}
```
저장 후:
```bash
sudo nginx -t          # 문법 확인
sudo systemctl reload nginx
```

## 8. 확인
```bash
curl https://yangti.shop/python/      # {"status":"ok"}
```
※ yangti.shop 에 이미 HTTPS(SSL)가 설정돼 있어야 합니다. (certbot 등)

---

# B. Vercel (Next.js) 배포

## 1. GitHub에 코드 올리기 (이미 했다면 생략)

## 2. Vercel 접속 → 저장소 import
https://vercel.com → New Project → 본인 저장소 선택

## 3. 환경변수 설정 (선택)
기본값이 `https://yangti.shop/python/detect` 라 안 넣어도 되지만,
주소 바꾸려면 Vercel → Settings → Environment Variables:
```
DETECT_API_URL = https://yangti.shop/python/detect
```

## 4. Deploy 클릭 → 끝
배포된 Vercel 주소로 접속하면 화면이 뜨고,
감지는 라이트세일이 처리합니다.

---

# 동작 흐름
```
사용자가 이미지 업로드
  → Vercel route.ts 가 받음
  → https://yangti.shop/python/detect 로 전달 (서버→서버)
  → 라이트세일이 YOLO 돌려서 결과 반환
  → 화면에 박스 + 통계 표시
```

# 문제 해결
- **한글 깨짐** → 라이트세일에서 `sudo apt install -y fonts-nanum`
- **502 에러** → API 서버 떴는지 `pm2 status`, `curl localhost:8000/`
- **413 에러** → nginx에 `client_max_body_size 20M;` 확인
- **CORS** → 서버→서버 호출이라 문제없음 (route.ts 프록시 방식)
- **느림** → CPU라 이미지 1장당 2~8초 정상
