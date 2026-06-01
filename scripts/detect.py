#!/usr/bin/env python3
import sys
import json
import cv2
import base64
from pathlib import Path
from ultralytics import YOLO
from PIL import Image, ImageDraw, ImageFont
import torch

# COCO 클래스 한글 매핑
CLASS_NAMES_KO = {
    'person': '사람', 'bicycle': '자전거', 'car': '자동차', 'motorcycle': '오토바이',
    'airplane': '비행기', 'bus': '버스', 'train': '기차', 'truck': '트럭',
    'boat': '보트', 'traffic light': '신호등', 'fire hydrant': '소화전', 'stop sign': '정지신호',
    'parking meter': '주차미터', 'bench': '벤치', 'cat': '고양이', 'dog': '강아지',
    'horse': '말', 'sheep': '양', 'cow': '소', 'elephant': '코끼리',
    'bear': '곰', 'zebra': '얼룩말', 'giraffe': '기린', 'backpack': '배낭',
    'umbrella': '우산', 'handbag': '핸드백', 'tie': '넥타이', 'suitcase': '여행가방',
    'frisbee': '프리스비', 'skis': '스키', 'snowboard': '스노우보드', 'sports ball': '스포츠볼',
    'kite': '연', 'baseball bat': '야구배트', 'baseball glove': '야구글로브', 'skateboard': '스케이트보드',
    'surfboard': '서핑보드', 'tennis racket': '테니스라켓', 'bottle': '병', 'wine glass': '와인잔',
    'cup': '컵', 'fork': '포크', 'knife': '나이프', 'spoon': '숟가락',
    'bowl': '그릇', 'banana': '바나나', 'apple': '사과', 'sandwich': '샌드위치',
    'orange': '오렌지', 'broccoli': '브로콜리', 'carrot': '당근', 'hot dog': '핫도그',
    'pizza': '피자', 'donut': '도넛', 'cake': '케이크', 'chair': '의자',
    'couch': '소파', 'potted plant': '화분', 'bed': '침대', 'dining table': '식탁',
    'toilet': '변기', 'tv': '텔레비전', 'laptop': '노트북', 'mouse': '마우스',
    'remote': '리모콘', 'keyboard': '키보드', 'cell phone': '핸드폰', 'microwave': '전자레인지', 'oven': '오븐',
    'toaster': '토스터', 'sink': '싱크대', 'refrigerator': '냉장고', 'book': '책',
    'clock': '시계', 'vase': '꽃병', 'scissors': '가위', 'teddy bear': '테디베어',
    'hair drier': '헤어드라이어', 'toothbrush': '칫솔'
}

def translate_class(class_name):
    """영어 클래스명을 한글로 변환"""
    return CLASS_NAMES_KO.get(class_name.lower(), class_name)

def draw_korean_text(image, text, position, color=(0, 255, 0), font_size=20):
    """PIL을 사용해서 한글 텍스트 그리기"""
    pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(pil_image)

    try:
        # 한글 폰트 경로 (Windows + Linux 모두 지원)
        font_paths = [
            "C:\\Windows\\Fonts\\malgun.ttf",                              # Windows - Malgun Gothic
            "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",            # Linux - 나눔고딕
            "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",        # Linux - 나눔고딕 Bold
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",     # Linux - Noto Sans CJK
        ]

        font = None
        for path in font_paths:
            try:
                font = ImageFont.truetype(path, font_size)
                break
            except:
                continue

        if font is None:
            font = ImageFont.load_default()

        draw.text(position, text, font=font, fill=color)
        return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"한글 폰트 로드 실패, 기본 폰트 사용: {e}", file=sys.stderr)
        return image

def main():
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)

    input_image_path = sys.argv[1]
    output_json_path = sys.argv[2]
    model_path = sys.argv[3]

    try:
        # 모델 로드
        model = YOLO(model_path)

        # 이미지 추론
        results = model(input_image_path)

        # 결과 파싱
        detections = []
        image = cv2.imread(input_image_path)

        if results and len(results) > 0:
            result = results[0]
            if result.boxes is not None:
                for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                    class_name_en = model.names[int(cls)]
                    class_name = translate_class(class_name_en)
                    x1, y1, x2, y2 = [int(x) for x in box.tolist()]

                    detections.append({
                        "class": class_name,
                        "confidence": float(conf),
                        "box": [float(x) for x in box.tolist()]
                    })

                    # 바운딩박스 그리기
                    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)

                    # 라벨 텍스트
                    label = f"{class_name} {float(conf):.1%}"

                    # 라벨 배경 그리기
                    font_scale = 0.6
                    thickness = 2
                    text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)[0]
                    text_x = x1
                    text_y = y1 - 10 if y1 > 30 else y1 + text_size[1] + 10

                    cv2.rectangle(image, (text_x, text_y - text_size[1] - 5),
                                (text_x + text_size[0] + 5, text_y + 5), (0, 255, 0), -1)

                    # PIL로 한글 텍스트 그리기
                    image = draw_korean_text(image, label, (text_x + 2, text_y - text_size[1] - 3),
                                            color=(0, 0, 0), font_size=16)

        # 처리된 이미지를 base64로 변환
        success, buffer = cv2.imencode('.jpg', image)
        if success:
            image_base64 = base64.b64encode(buffer).decode('utf-8')
        else:
            image_base64 = None

        # JSON으로 저장 (이미지 포함)
        result_data = {
            "detections": detections,
            "image": f"data:image/jpeg;base64,{image_base64}" if image_base64 else None
        }

        with open(output_json_path, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)

        print(f"Detection completed: {len(detections)} objects found")

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        # 빈 결과 저장
        with open(output_json_path, 'w') as f:
            json.dump({"detections": [], "image": None}, f)
        sys.exit(1)

if __name__ == "__main__":
    import numpy as np
    main()
