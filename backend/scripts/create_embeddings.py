#!/usr/bin/env python3
"""
스트레칭 데이터의 임베딩을 생성하고 파일로 저장하는 스크립트
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
    
    # 1. 데이터 파일 경로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(os.path.dirname(script_dir))
    data_path = os.path.join(base_dir, "backend", "data", "final_data.json")
    output_path = os.path.join(base_dir, "backend", "data", "embeddings.json")
    
    print(f"데이터 파일 경로: {data_path}")
    print(f"임베딩 저장 경로: {output_path}")
    
    # 2. 데이터 로드
    print("데이터 로드 중...")
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 3. 모델 로드
    print("LaBSE 모델 로드 중...")
    model = SentenceTransformer('sentence-transformers/LaBSE')
    print("모델 로드 완료!")
    
    # 4. 임베딩 생성
    print("임베딩 생성 중...")
    embeddings = {}
    exercise_count = 0
    
    # 각 근육별 운동 데이터 처리
    for muscle_name, muscle_data in tqdm(data.get("muscles", {}).items(), desc="근육 처리"):
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
    
    # 5. 임베딩 저장
    print(f"임베딩 저장 중... (총 {exercise_count}개 운동)")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(embeddings, f)
    
    end_time = time.time()
    print(f"임베딩 생성 완료! 소요 시간: {end_time - start_time:.2f}초")
    print(f"총 {exercise_count}개 운동의 임베딩이 {output_path}에 저장되었습니다.")
    
    return exercise_count

if __name__ == "__main__":
    create_embeddings() 