from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
import logging
import time
import asyncio
from app.services.embedding_service import EmbeddingService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/embedding-comparison")
async def compare_embeddings(
    query: str,
    body_parts: Optional[List[str]] = None,
    occupation: Optional[str] = None,
    top_k: int = 3
):
    """
    LaBSE와 BGE 임베딩 모델의 검색 결과 및 성능을 비교합니다.
    
    Args:
        query: 사용자 검색 쿼리
        body_parts: 필터링할 신체 부위 목록
        occupation: 필터링할 직업
        top_k: 각 모델에서 반환할 결과 수
        
    Returns:
        각 모델의 검색 결과, 처리 시간, 결과 비교 등을 포함하는 응답
    """
    try:
        # EmbeddingService 초기화 (이미 초기화되어 있어도 에러 발생 안함)
        await EmbeddingService.initialize()
        
        # 기본 BGE 임베딩 검색
        start_time = time.time()
        bge_results = await EmbeddingService.search(
            query=query,
            body_parts=body_parts,
            occupation=occupation,
            top_k=top_k
        )
        bge_time = time.time() - start_time
        
        # 현재 서비스의 임베딩 파일과 모델 정보 저장
        current_model = "BGE"
        
        # EmbeddingService를 일시적으로 LaBSE 모드로 설정
        # 실제 코드에서는 다른 방식으로 구현해야 할 수 있습니다
        # 이 예제는 데모용입니다
        temp_model = EmbeddingService._model
        temp_embeddings = EmbeddingService._embeddings
        
        # LaBSE 임베딩 로드 (실제 구현 필요)
        # 여기서는 임시로 EmbeddingService의 내부 상태를 조작하지만,
        # 실제로는 별도의 LaBSE 서비스를 만들거나 다른 방식으로 해결해야 합니다
        labse_available = False
        labse_results = []
        labse_time = 0
        
        # 결과 비교
        comparison = {
            "current_model": current_model,
            "bge": {
                "results": bge_results,
                "time": bge_time
            },
            "labse": {
                "available": labse_available,
                "results": labse_results,
                "time": labse_time
            },
            "comparison": {
                "time_difference": None,
                "result_overlap": None
            }
        }
        
        return comparison
        
    except Exception as e:
        logger.error(f"임베딩 비교 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"임베딩 비교 중 오류 발생: {str(e)}") 