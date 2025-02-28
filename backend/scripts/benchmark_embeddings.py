import os
import json
import time
import asyncio
import numpy as np
from typing import List, Dict, Any, Tuple
from sentence_transformers import SentenceTransformer

# 테스트 쿼리 세트
TEST_QUERIES = [
    "목이 뻐근하고 어깨가 무겁습니다",
    "컴퓨터 작업 후 허리가 아파요",
    "운동 후 종아리 근육통이 심해요",
    "무릎이 시리고 통증이 있어요",
    "손목이 자주 저리고 아픕니다"
]

# 직업 필터 테스트
TEST_OCCUPATIONS = ["사무직", "운전기사", "학생"]

# 벤치마크 클래스
class EmbeddingBenchmark:
    def __init__(self, labse_path, bge_path, data_path):
        self.data_path = data_path
        self.labse_path = labse_path
        self.bge_path = bge_path
        self.labse_model = None
        self.bge_model = None
        self.data = None
        self.labse_embeddings = None
        self.bge_embeddings = None
    
    async def initialize(self):
        # 데이터 로드
        print("데이터 로드 중...")
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        
        # LaBSE 임베딩 로드
        print(f"LaBSE 임베딩 로드 중: {self.labse_path}")
        with open(self.labse_path, "r", encoding="utf-8") as f:
            self.labse_embeddings = json.load(f)
        
        # BGE 임베딩 로드
        print(f"BGE 임베딩 로드 중: {self.bge_path}")
        with open(self.bge_path, "r", encoding="utf-8") as f:
            self.bge_embeddings = json.load(f)
        
        # 모델 로드
        print("LaBSE 모델 로드 중...")
        self.labse_model = SentenceTransformer('sentence-transformers/LaBSE')
        
        print("BGE 모델 로드 중...")
        self.bge_model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
        
        print("초기화 완료!")
    
    async def search(self, query, model_type, occupation=None, top_k=3):
        start_time = time.time()
        
        # 모델 선택
        if model_type == "labse":
            model = self.labse_model
            embeddings = self.labse_embeddings
        else:  # bge
            model = self.bge_model
            embeddings = self.bge_embeddings
        
        # 쿼리 임베딩 생성
        query_embedding = model.encode(query)
        
        # 결과 저장 리스트
        results = []
        
        # 각 근육별 운동 데이터 처리
        for muscle_name, muscle_data in self.data.get("muscles", {}).items():
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
                if exercise_id in embeddings:
                    # 유사도 계산
                    embedding = np.array(embeddings[exercise_id])
                    similarity = float(np.dot(query_embedding, embedding) / 
                                  (np.linalg.norm(query_embedding) * np.linalg.norm(embedding)))
                    
                    # 결과 추가
                    results.append({
                        "similarity": similarity,
                        "muscle": muscle_name,
                        "exercise": exercise,
                        "id": exercise_id
                    })
        
        # 유사도 기준 정렬
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        # 상위 k개 결과
        top_results = results[:top_k]
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        return {
            "results": top_results,
            "time": processing_time
        }
    
    async def run_benchmark(self):
        results = {
            "labse": {"total_time": 0, "queries": {}},
            "bge": {"total_time": 0, "queries": {}}
        }
        
        # 기본 쿼리 테스트
        print("기본 쿼리 테스트 실행 중...")
        for query in TEST_QUERIES:
            print(f"\n쿼리: {query}")
            
            # LaBSE 검색
            labse_result = await self.search(query, "labse")
            results["labse"]["queries"][query] = {
                "time": labse_result["time"],
                "top_results": [{"id": r["id"], "similarity": r["similarity"]} for r in labse_result["results"]]
            }
            results["labse"]["total_time"] += labse_result["time"]
            print(f"LaBSE 검색 시간: {labse_result['time']:.4f}초")
            
            # BGE 검색
            bge_result = await self.search(query, "bge")
            results["bge"]["queries"][query] = {
                "time": bge_result["time"],
                "top_results": [{"id": r["id"], "similarity": r["similarity"]} for r in bge_result["results"]]
            }
            results["bge"]["total_time"] += bge_result["time"]
            print(f"BGE 검색 시간: {bge_result['time']:.4f}초")
            
            # 결과 비교
            labse_ids = [r["id"] for r in labse_result["results"]]
            bge_ids = [r["id"] for r in bge_result["results"]]
            overlap = len(set(labse_ids) & set(bge_ids))
            print(f"결과 일치도: {overlap}/{len(labse_ids)} ({overlap/len(labse_ids)*100:.1f}%)")
        
        # 직업 필터 테스트
        print("\n직업 필터 테스트 실행 중...")
        for occupation in TEST_OCCUPATIONS:
            for query in TEST_QUERIES[:2]:  # 처음 두 개 쿼리만 테스트
                query_with_occupation = f"{query} (직업: {occupation})"
                print(f"\n쿼리: {query_with_occupation}")
                
                # LaBSE 검색
                labse_result = await self.search(query, "labse", occupation)
                results["labse"]["queries"][query_with_occupation] = {
                    "time": labse_result["time"],
                    "top_results": [{"id": r["id"], "similarity": r["similarity"]} for r in labse_result["results"]]
                }
                results["labse"]["total_time"] += labse_result["time"]
                print(f"LaBSE 검색 시간: {labse_result['time']:.4f}초")
                
                # BGE 검색
                bge_result = await self.search(query, "bge", occupation)
                results["bge"]["queries"][query_with_occupation] = {
                    "time": bge_result["time"],
                    "top_results": [{"id": r["id"], "similarity": r["similarity"]} for r in bge_result["results"]]
                }
                results["bge"]["total_time"] += bge_result["time"]
                print(f"BGE 검색 시간: {bge_result['time']:.4f}초")
        
        # 결과 저장
        output_path = os.path.join(os.path.dirname(self.data_path), "benchmark_results.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n벤치마크 결과 저장 완료: {output_path}")
        print(f"LaBSE 총 처리 시간: {results['labse']['total_time']:.4f}초")
        print(f"BGE 총 처리 시간: {results['bge']['total_time']:.4f}초")
        
        return results

# 메인 함수
async def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "data.json")
    labse_path = os.path.join(base_dir, "data", "embeddings.json")
    bge_path = os.path.join(base_dir, "data", "embeddings_bge.json")
    
    benchmark = EmbeddingBenchmark(labse_path, bge_path, data_path)
    await benchmark.initialize()
    await benchmark.run_benchmark()

if __name__ == "__main__":
    asyncio.run(main()) 