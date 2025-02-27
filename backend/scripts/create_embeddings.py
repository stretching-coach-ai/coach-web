#!/usr/bin/env python3
"""
스트레칭 데이터의 임베딩을 생성하고 파일로 저장하는 스크립트
BGE 모델을 이용한 버전
"""
import json
import os
import time
from tqdm import tqdm
import numpy as np
from sentence_transformers import SentenceTransformer

def create_embeddings():
    """스트레칭 데이터의 임베딩 생성 및 저장"""
    start_time = time.time()
    
    # 1. 데이터 파일 경로 설정 - 수정된 부분
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(os.path.dirname(script_dir))
    data_path = os.path.join(base_dir, "backend", "data", "data.json")  # final_data.json에서 data.json으로 변경
    output_path = os.path.join(base_dir, "backend", "data", "embeddings_bge.json")  # BGE 모델용 파일명 변경
    
    # 경로가 올바른지 확인하고 필요시 조정
    if not os.path.exists(data_path):
        # 현재 디렉토리 기준으로 시도
        current_dir = os.getcwd()
        if current_dir.endswith('backend'):
            data_path = os.path.join(current_dir, "data", "data.json")  # final_data.json에서 data.json으로 변경
            output_path = os.path.join(current_dir, "data", "embeddings_bge.json")  # BGE 모델용 파일명 변경
        elif current_dir.endswith('scripts'):
            data_path = os.path.join(os.path.dirname(current_dir), "data", "data.json")  # final_data.json에서 data.json으로 변경
            output_path = os.path.join(os.path.dirname(current_dir), "data", "embeddings_bge.json")  # BGE 모델용 파일명 변경
    
    print(f"데이터 파일 경로: {data_path}")
    print(f"임베딩 저장 경로: {output_path}")
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"데이터 파일을 찾을 수 없습니다: {data_path}")
    
    # 2. 데이터 로드
    print("데이터 로드 중...")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 3. 모델 로드 - BGE 모델로 변경
    print("BGE 모델 로드 중...")
    # 다국어(영어+중국어) 지원 모델을 선택했지만, 한국어에 더 적합한 다른 모델로 대체 가능
    model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
    print("모델 로드 완료!")
    
    # 4. 임베딩 생성
    print("임베딩 생성 중...")
    embeddings = {}
    exercise_count = 0
    
    # 메타데이터에서 모든 근육 목록 가져오기
    all_muscles = data['metadata'].get('front_muscles', []) + data['metadata'].get('back_muscles', [])
    all_muscles = list(set(all_muscles))  # 중복 제거
    print(f"메타데이터에 정의된 총 근육 수: {len(all_muscles)}")
    print(f"실제 데이터에 있는 근육 수: {len(data.get('muscles', {}))}")
    
    # 각 근육별 운동 데이터 처리
    for muscle_name in tqdm(all_muscles, desc="근육 처리"):
        if muscle_name in data.get("muscles", {}):
            muscle_data = data["muscles"][muscle_name]
            exercise_count_for_muscle = len(muscle_data.get("exercises", []))
            print(f"근육 처리 중: {muscle_name}, 운동 수: {exercise_count_for_muscle}")
            
            for i, exercise in enumerate(muscle_data.get("exercises", [])):
                # 고유 ID 생성
                exercise_id = exercise.get("id", f"{muscle_name}_{i}")
                
                # 텍스트 추출 및 결합
                texts = []
                
                # 영어 텍스트 추출
                title = exercise.get("title", "")
                abstract = exercise.get("abstract", "")
                
                # 한국어 텍스트 추출
                enhanced = exercise.get("enhanced_metadata", {})
                stretching_details = enhanced.get("스트레칭_상세화", {})
                
                steps = stretching_details.get("동작_단계", [])
                steps_text = " ".join(steps) if steps else ""
                
                breathing = stretching_details.get("호흡_패턴", [])
                breathing_text = " ".join(breathing) if breathing else ""
                
                feeling = stretching_details.get("느껴야_할_감각", "")
                
                # 텍스트 결합
                if title:
                    texts.append(title)
                if abstract:
                    texts.append(abstract)
                if steps_text:
                    texts.append(steps_text)
                if breathing_text:
                    texts.append(breathing_text)
                if feeling:
                    texts.append(feeling)
                
                # 최종 텍스트 생성
                combined_text = " ".join(texts)
                
                if combined_text.strip():
                    # 임베딩 생성
                    embedding = model.encode(combined_text)
                    embeddings[exercise_id] = embedding.tolist()
                    exercise_count += 1
                    print(f"임베딩 생성 완료: {exercise_id} - {title[:50]}...")
        else:
            print(f"경고: '{muscle_name}' 근육에 대한 데이터가 없습니다.")
    
    # 5. 임베딩 저장
    print(f"임베딩 저장 중... (총 {exercise_count}개 운동)")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(embeddings, f)
    
    end_time = time.time()
    print(f"임베딩 생성 완료! 소요 시간: {end_time - start_time:.2f}초")
    print(f"총 {exercise_count}개 운동의 임베딩이 {output_path}에 저장되었습니다.")
    
    # 6. 누락된 근육 정보 출력
    missing_muscles = [m for m in all_muscles if m not in data.get("muscles", {})]
    if missing_muscles:
        print("\n경고: 다음 근육에 대한 데이터가 없습니다:")
        for muscle in missing_muscles:
            print(f"- {muscle}")
    
    return exercise_count

if __name__ == "__main__":
    create_embeddings() 