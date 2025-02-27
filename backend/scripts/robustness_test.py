import os
import json
import time
import asyncio
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter
from sentence_transformers import SentenceTransformer
from collections import defaultdict
import platform

# 한글 폰트 설정
def set_korean_font():
    """시스템에 맞는 한글 폰트 설정"""
    system = platform.system()
    
    if system == 'Darwin':  # macOS
        plt.rcParams['font.family'] = 'AppleGothic'
    elif system == 'Windows':
        plt.rcParams['font.family'] = 'Malgun Gothic'
    elif system == 'Linux':
        plt.rcParams['font.family'] = 'NanumGothic'
    
    # 공통 설정
    plt.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지

# 기본 쿼리 및 변형 쿼리 세트
BASE_QUERIES = [
    "목이 뻐근하고 어깨가 무겁습니다",
    "컴퓨터 작업 후 허리가 아파요",
    "손목이 자주 저리고 아픕니다"
]

# 각 기본 쿼리에 대한 변형 쿼리 생성
def generate_query_variations():
    variations = {}
    for base_query in BASE_QUERIES:
        # 각 기본 쿼리에 대해 3개의 변형 생성
        if "목이 뻐근하고" in base_query:
            variations[base_query] = [
                "목이 뻐근하고 어깨에 무거운 느낌이 있어요",
                "목 부분이 뻣뻣하고 어깨가 무거워요",
                "목에 뻐근함이 있고 어깨가 무겁습니다"
            ]
        elif "컴퓨터 작업 후" in base_query:
            variations[base_query] = [
                "컴퓨터로 오래 일한 뒤 허리통증이 있습니다",
                "컴퓨터 일을 많이 하고 나면 허리가 아픕니다",
                "PC 작업 후에 허리 부분이 아파요"
            ]
        elif "손목이 자주" in base_query:
            variations[base_query] = [
                "손목 부분이 자주 저리면서 통증이 있어요",
                "손목에 저림이 있고 가끔 아픕니다",
                "손목이 종종 저리고 통증이 느껴집니다"
            ]
    return variations

# 임베딩 테스트 클래스
class RobustnessTest:
    def __init__(self, data_path, labse_path, bge_path):
        self.data_path = data_path
        self.labse_path = labse_path
        self.bge_path = bge_path
        self.data = None
        self.labse_embeddings = None
        self.bge_embeddings = None
        self.labse_model = None
        self.bge_model = None
        self.results_dir = os.path.join(os.path.dirname(data_path), "robustness_test_results")
        os.makedirs(self.results_dir, exist_ok=True)
    
    async def initialize(self):
        """데이터 및 모델 초기화"""
        print("데이터 및 모델 초기화 중...")
        
        # 데이터 로드
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)
        
        # 임베딩 로드
        with open(self.labse_path, "r", encoding="utf-8") as f:
            self.labse_embeddings = json.load(f)
        
        with open(self.bge_path, "r", encoding="utf-8") as f:
            self.bge_embeddings = json.load(f)
        
        # 모델 로드
        self.labse_model = SentenceTransformer('sentence-transformers/LaBSE')
        self.bge_model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
        
        print("초기화 완료!")
    
    async def search(self, query, model_type, top_k=3):
        """검색 함수"""
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
            "time": processing_time,
            "query": query
        }
    
    async def test_consistency(self, repetitions=5):
        """동일 쿼리 반복 테스트"""
        print("\n===== 내부 일관성 테스트 (동일 쿼리 반복) =====")
        
        consistency_results = {
            "labse": {},
            "bge": {}
        }
        
        for query in BASE_QUERIES:
            print(f"\n쿼리: {query}")
            
            for model_type in ["labse", "bge"]:
                print(f"\n{model_type.upper()} 모델 테스트:")
                model_results = []
                execution_times = []
                
                for i in range(repetitions):
                    result = await self.search(query, model_type)
                    result_ids = [r["id"] for r in result["results"]]
                    model_results.append(result_ids)
                    execution_times.append(result["time"])
                    print(f"  실행 {i+1}: {', '.join(result_ids[:3])} ({result['time']:.4f}초)")
                
                # 결과 일관성 확인
                is_consistent = all(r == model_results[0] for r in model_results)
                consistency_percent = 100 if is_consistent else 0
                
                # 실행 시간 변동성
                avg_time = np.mean(execution_times)
                std_time = np.std(execution_times)
                
                consistency_results[model_type][query] = {
                    "is_consistent": is_consistent,
                    "consistency_percent": consistency_percent,
                    "avg_time": avg_time,
                    "std_time": std_time,
                    "result_sets": model_results
                }
                
                consistency_status = "일치" if is_consistent else "불일치"
                print(f"  결과: {consistency_status} (평균 {avg_time:.4f}초, 표준편차 {std_time:.4f}초)")
        
        return consistency_results
    
    async def test_variations(self):
        """쿼리 변형에 대한 강건성 테스트"""
        print("\n===== 쿼리 변형 강건성 테스트 =====")
        
        variations = generate_query_variations()
        variation_results = {
            "labse": {},
            "bge": {}
        }
        
        for base_query, variation_queries in variations.items():
            print(f"\n기본 쿼리: {base_query}")
            all_queries = [base_query] + variation_queries
            
            for model_type in ["labse", "bge"]:
                print(f"\n{model_type.upper()} 모델 테스트:")
                
                # 모든 쿼리 결과 수집
                query_results = {}
                for query in all_queries:
                    result = await self.search(query, model_type)
                    result_ids = [r["id"] for r in result["results"]]
                    query_results[query] = {
                        "ids": result_ids,
                        "time": result["time"]
                    }
                    
                    # 짧은 쿼리 출력용
                    short_query = query[:20] + "..." if len(query) > 20 else query
                    print(f"  '{short_query}': {', '.join(result_ids[:3])} ({result['time']:.4f}초)")
                
                # 기본 쿼리 결과를 기준으로 일치도 계산
                base_result_ids = set(query_results[base_query]["ids"])
                overlap_scores = {}
                
                for query, result in query_results.items():
                    if query != base_query:
                        variation_ids = set(result["ids"])
                        overlap = len(base_result_ids & variation_ids)
                        overlap_percent = (overlap / len(base_result_ids)) * 100 if base_result_ids else 0
                        overlap_scores[query] = overlap_percent
                        
                        # 짧은 쿼리 출력용
                        short_query = query[:20] + "..." if len(query) > 20 else query
                        print(f"  '{short_query}' 일치도: {overlap_percent:.1f}%")
                
                # 평균 일치도 계산
                avg_overlap = np.mean(list(overlap_scores.values())) if overlap_scores else 0
                print(f"  평균 일치도: {avg_overlap:.1f}%")
                
                variation_results[model_type][base_query] = {
                    "base_results": query_results[base_query]["ids"],
                    "variation_results": {q: query_results[q]["ids"] for q in variation_queries},
                    "overlap_scores": overlap_scores,
                    "avg_overlap": avg_overlap
                }
        
        return variation_results
    
    def visualize_consistency_results(self, consistency_results):
        """내부 일관성 테스트 결과 시각화"""
        print("\n내부 일관성 테스트 결과 시각화 중...")
        
        # 쿼리별 모델 일관성 그래프
        plt.figure(figsize=(12, 6))
        
        x = np.arange(len(BASE_QUERIES))
        bar_width = 0.35
        
        labse_consistency = [consistency_results["labse"][q]["consistency_percent"] for q in BASE_QUERIES]
        bge_consistency = [consistency_results["bge"][q]["consistency_percent"] for q in BASE_QUERIES]
        
        plt.bar(x - bar_width/2, labse_consistency, bar_width, label='LaBSE', color='skyblue')
        plt.bar(x + bar_width/2, bge_consistency, bar_width, label='BGE', color='lightcoral')
        
        plt.xlabel('검색 쿼리')
        plt.ylabel('일관성 (%)')
        plt.title('LaBSE vs BGE: 내부 일관성 비교')
        plt.xticks(x, [q[:15] + '...' for q in BASE_QUERIES])
        plt.ylim(0, 105)
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        plt.savefig(os.path.join(self.results_dir, 'consistency_comparison.png'), dpi=300)
        
        # 쿼리별 실행 시간 그래프
        plt.figure(figsize=(12, 6))
        
        labse_times = [consistency_results["labse"][q]["avg_time"] for q in BASE_QUERIES]
        bge_times = [consistency_results["bge"][q]["avg_time"] for q in BASE_QUERIES]
        
        plt.bar(x - bar_width/2, labse_times, bar_width, label='LaBSE', color='skyblue')
        plt.bar(x + bar_width/2, bge_times, bar_width, label='BGE', color='lightcoral')
        
        plt.xlabel('검색 쿼리')
        plt.ylabel('평균 실행 시간 (초)')
        plt.title('LaBSE vs BGE: 실행 시간 비교')
        plt.xticks(x, [q[:15] + '...' for q in BASE_QUERIES])
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        plt.savefig(os.path.join(self.results_dir, 'execution_time_comparison.png'), dpi=300)
    
    def visualize_variation_results(self, variation_results):
        """쿼리 변형 테스트 결과 시각화"""
        print("\n쿼리 변형 테스트 결과 시각화 중...")
        
        variations = generate_query_variations()
        
        # 각 기본 쿼리에 대한 일치도 그래프
        for i, base_query in enumerate(BASE_QUERIES):
            plt.figure(figsize=(12, 6))
            
            variation_queries = variations[base_query]
            x = np.arange(len(variation_queries))
            bar_width = 0.35
            
            # 짧은 쿼리 레이블 생성
            short_variations = []
            for q in variation_queries:
                words = q.split()
                if len(words) > 2:
                    short_variations.append(' '.join(words[:2]) + '...')
                else:
                    short_variations.append(q[:15] + '...')
            
            labse_overlaps = [variation_results["labse"][base_query]["overlap_scores"][q] for q in variation_queries]
            bge_overlaps = [variation_results["bge"][base_query]["overlap_scores"][q] for q in variation_queries]
            
            plt.bar(x - bar_width/2, labse_overlaps, bar_width, label='LaBSE', color='skyblue')
            plt.bar(x + bar_width/2, bge_overlaps, bar_width, label='BGE', color='lightcoral')
            
            plt.xlabel('변형 쿼리')
            plt.ylabel('기본 쿼리와의 일치도 (%)')
            plt.title(f'쿼리 변형 강건성: {base_query[:15]}...')
            plt.xticks(x, short_variations)
            plt.ylim(0, 105)
            plt.legend()
            plt.grid(axis='y', linestyle='--', alpha=0.7)
            
            plt.savefig(os.path.join(self.results_dir, f'variation_robustness_{i+1}.png'), dpi=300)
        
        # 모델별 평균 일치도 비교
        plt.figure(figsize=(12, 6))
        
        x = np.arange(len(BASE_QUERIES))
        bar_width = 0.35
        
        labse_avg_overlaps = [variation_results["labse"][q]["avg_overlap"] for q in BASE_QUERIES]
        bge_avg_overlaps = [variation_results["bge"][q]["avg_overlap"] for q in BASE_QUERIES]
        
        plt.bar(x - bar_width/2, labse_avg_overlaps, bar_width, label='LaBSE', color='skyblue')
        plt.bar(x + bar_width/2, bge_avg_overlaps, bar_width, label='BGE', color='lightcoral')
        
        plt.xlabel('기본 쿼리')
        plt.ylabel('평균 일치도 (%)')
        plt.title('LaBSE vs BGE: 쿼리 변형 강건성 비교')
        plt.xticks(x, [q[:15] + '...' for q in BASE_QUERIES])
        plt.ylim(0, 105)
        plt.legend()
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        plt.savefig(os.path.join(self.results_dir, 'avg_variation_robustness.png'), dpi=300)
    
    def analyze_and_report(self, consistency_results, variation_results):
        """결과 분석 및 보고서 생성"""
        print("\n결과 분석 및 보고서 생성 중...")
        
        report = {
            "consistency_test": {
                "labse": {
                    "overall_consistency": all(consistency_results["labse"][q]["is_consistent"] for q in BASE_QUERIES),
                    "consistency_by_query": {q: consistency_results["labse"][q]["is_consistent"] for q in BASE_QUERIES},
                    "avg_execution_time": np.mean([consistency_results["labse"][q]["avg_time"] for q in BASE_QUERIES])
                },
                "bge": {
                    "overall_consistency": all(consistency_results["bge"][q]["is_consistent"] for q in BASE_QUERIES),
                    "consistency_by_query": {q: consistency_results["bge"][q]["is_consistent"] for q in BASE_QUERIES},
                    "avg_execution_time": np.mean([consistency_results["bge"][q]["avg_time"] for q in BASE_QUERIES])
                }
            },
            "variation_test": {
                "labse": {
                    "avg_robustness": np.mean([variation_results["labse"][q]["avg_overlap"] for q in BASE_QUERIES]),
                    "robustness_by_query": {q: variation_results["labse"][q]["avg_overlap"] for q in BASE_QUERIES}
                },
                "bge": {
                    "avg_robustness": np.mean([variation_results["bge"][q]["avg_overlap"] for q in BASE_QUERIES]),
                    "robustness_by_query": {q: variation_results["bge"][q]["avg_overlap"] for q in BASE_QUERIES}
                }
            },
            "conclusion": {
                "consistency_winner": "labse" if all(consistency_results["labse"][q]["is_consistent"] for q in BASE_QUERIES) and not all(consistency_results["bge"][q]["is_consistent"] for q in BASE_QUERIES) else
                                     "bge" if all(consistency_results["bge"][q]["is_consistent"] for q in BASE_QUERIES) and not all(consistency_results["labse"][q]["is_consistent"] for q in BASE_QUERIES) else
                                     "tie",
                "variation_robustness_winner": "labse" if np.mean([variation_results["labse"][q]["avg_overlap"] for q in BASE_QUERIES]) > np.mean([variation_results["bge"][q]["avg_overlap"] for q in BASE_QUERIES]) else
                                              "bge" if np.mean([variation_results["bge"][q]["avg_overlap"] for q in BASE_QUERIES]) > np.mean([variation_results["labse"][q]["avg_overlap"] for q in BASE_QUERIES]) else
                                              "tie",
                "speed_winner": "labse" if np.mean([consistency_results["labse"][q]["avg_time"] for q in BASE_QUERIES]) < np.mean([consistency_results["bge"][q]["avg_time"] for q in BASE_QUERIES]) else
                                "bge" if np.mean([consistency_results["bge"][q]["avg_time"] for q in BASE_QUERIES]) < np.mean([consistency_results["labse"][q]["avg_time"] for q in BASE_QUERIES]) else
                                "tie"
            }
        }
        
        # 보고서 저장
        with open(os.path.join(self.results_dir, 'robustness_test_report.json'), 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 요약 출력
        print("\n===== 테스트 결과 요약 =====")
        
        print("\n1. 내부 일관성 테스트:")
        print(f"  LaBSE: {'일관성 있음' if report['consistency_test']['labse']['overall_consistency'] else '일관성 없음'}")
        print(f"  BGE: {'일관성 있음' if report['consistency_test']['bge']['overall_consistency'] else '일관성 없음'}")
        print(f"  평균 실행 시간 - LaBSE: {report['consistency_test']['labse']['avg_execution_time']:.4f}초, BGE: {report['consistency_test']['bge']['avg_execution_time']:.4f}초")
        
        print("\n2. 쿼리 변형 강건성 테스트:")
        print(f"  LaBSE 평균 강건성: {report['variation_test']['labse']['avg_robustness']:.2f}%")
        print(f"  BGE 평균 강건성: {report['variation_test']['bge']['avg_robustness']:.2f}%")
        
        print("\n3. 종합 평가:")
        print(f"  내부 일관성 우수 모델: {report['conclusion']['consistency_winner'].upper()}")
        print(f"  쿼리 변형 강건성 우수 모델: {report['conclusion']['variation_robustness_winner'].upper()}")
        print(f"  속도 우수 모델: {report['conclusion']['speed_winner'].upper()}")
        
        return report
    
    async def run_all_tests(self):
        """모든 테스트 실행"""
        await self.initialize()
        
        # 내부 일관성 테스트
        consistency_results = await self.test_consistency()
        
        # 쿼리 변형 강건성 테스트
        variation_results = await self.test_variations()
        
        # 결과 시각화
        self.visualize_consistency_results(consistency_results)
        self.visualize_variation_results(variation_results)
        
        # 결과 분석 및 보고서
        report = self.analyze_and_report(consistency_results, variation_results)
        
        print(f"\n모든 테스트가 완료되었습니다. 결과는 {self.results_dir} 디렉토리에 저장되었습니다.")
        return report

# 메인 함수
async def main():
    # 한글 폰트 설정
    set_korean_font()
    
    # 파일 경로 설정
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "data.json")
    labse_path = os.path.join(base_dir, "data", "embeddings.json")
    bge_path = os.path.join(base_dir, "data", "embeddings_bge.json")
    
    # 강건성 테스트 실행
    test = RobustnessTest(data_path, labse_path, bge_path)
    await test.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main()) 