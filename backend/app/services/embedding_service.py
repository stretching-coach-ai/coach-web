"""
임베딩 관리 및 검색 서비스
"""
import json
import os
import logging
import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer

# 로거 설정
logger = logging.getLogger(__name__)

class EmbeddingService:
    """임베딩 관리 및 검색 서비스"""
    
    _model = None
    _embeddings = None
    _data = None
    _is_initialized = False
    
    @classmethod
    async def initialize(cls):
        """임베딩 및 데이터 초기화"""
        if cls._is_initialized:
            return
            
        try:
            logger.info("임베딩 서비스 초기화 중...")
            
            # 1. 데이터 파일 경로 설정
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_path = os.path.join(base_dir, "data", "final_data.json")
            embeddings_path = os.path.join(base_dir, "data", "embeddings.json")
            
            # 2. 데이터 로드
            logger.info(f"데이터 로드 중: {data_path}")
            with open(data_path, "r", encoding="utf-8") as f:
                cls._data = json.load(f)
            
            # 3. 임베딩 로드
            logger.info(f"임베딩 로드 중: {embeddings_path}")
            with open(embeddings_path, "r", encoding="utf-8") as f:
                cls._embeddings = json.load(f)
            
            # 4. 모델 로드
            logger.info("LaBSE 모델 로드 중...")
            cls._model = SentenceTransformer('sentence-transformers/LaBSE')
            
            cls._is_initialized = True
            logger.info(f"임베딩 서비스 초기화 완료! 총 {len(cls._embeddings)} 개의 임베딩 로드됨")
            
        except Exception as e:
            logger.error(f"임베딩 서비스 초기화 실패: {str(e)}", exc_info=True)
            raise
    
    @classmethod
    async def search(cls, 
                    query: str, 
                    body_parts: List[str] = None, 
                    occupation: str = None, 
                    top_k: int = 3) -> List[Dict[str, Any]]:
        """
        텍스트 쿼리와 메타데이터 필터를 기반으로 관련 스트레칭 검색
        
        Args:
            query: 검색 쿼리 (통증 설명 등)
            body_parts: 필터링할 신체 부위 목록
            occupation: 필터링할 직업
            top_k: 반환할 최대 결과 수
            
        Returns:
            관련성 높은 스트레칭 목록
        """
        if not cls._is_initialized:
            await cls.initialize()
        
        # 1. 쿼리 임베딩 생성
        query_embedding = cls._model.encode(query)
        
        # 2. 결과 저장 리스트
        results = []
        
        # 3. 각 근육별 운동 데이터 처리
        for muscle_name, muscle_data in cls._data.get("muscles", {}).items():
            # 신체 부위 필터링
            if body_parts and not any(part.lower() in muscle_name.lower() for part in body_parts):
                continue
            
            # 직업 필터링
            if occupation and "info" in muscle_data:
                occupations = muscle_data["info"].get("occupations", [])
                if not occupations or not any(occ.lower() in occupation.lower() for occ in occupations):
                    continue
            
            # 운동 데이터 처리
            for i, exercise in enumerate(muscle_data.get("exercises", [])):
                # 고유 ID 생성
                exercise_id = exercise.get("id", f"{muscle_name}_{i}")
                
                # 임베딩이 있는지 확인
                if exercise_id in cls._embeddings:
                    # 유사도 계산
                    embedding = np.array(cls._embeddings[exercise_id])
                    similarity = float(np.dot(query_embedding, embedding) / 
                                    (np.linalg.norm(query_embedding) * np.linalg.norm(embedding)))
                    
                    # 결과 추가
                    results.append({
                        "similarity": similarity,
                        "muscle": muscle_name,
                        "exercise": exercise
                    })
        
        # 4. 유사도 기준 정렬
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        # 5. 상위 k개 결과 반환
        return results[:top_k]
    
    @classmethod
    async def get_exercise_by_id(cls, exercise_id: str) -> Dict[str, Any]:
        """ID로 운동 데이터 조회"""
        if not cls._is_initialized:
            await cls.initialize()
            
        for muscle_name, muscle_data in cls._data.get("muscles", {}).items():
            for exercise in muscle_data.get("exercises", []):
                current_id = exercise.get("id", "")
                if current_id == exercise_id:
                    return {
                        "muscle": muscle_name,
                        "exercise": exercise
                    }
        
        return None 