import os
import json
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter
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

def load_benchmark_results(file_path):
    """벤치마크 결과 로드"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_speed(results):
    """속도 비교 분석"""
    labse_times = []
    bge_times = []
    queries = []
    
    # 기본 쿼리만 추출
    for query, data in results["labse"]["queries"].items():
        if "직업" not in query:
            labse_times.append(data["time"])
            queries.append(query)
    
    for query, data in results["bge"]["queries"].items():
        if "직업" not in query:
            bge_times.append(data["time"])
    
    # 평균 계산
    labse_avg = results["labse"]["total_time"] / len(results["labse"]["queries"])
    bge_avg = results["bge"]["total_time"] / len(results["bge"]["queries"])
    
    # 쿼리 레이블 축약
    short_queries = []
    for q in queries:
        if len(q) > 15:
            words = q.split()
            if len(words) > 2:
                short_queries.append(' '.join(words[:2]) + '...')
            else:
                short_queries.append(q[:15] + '...')
        else:
            short_queries.append(q)
    
    # 속도 비교 그래프
    plt.figure(figsize=(14, 7))
    
    bar_width = 0.35
    x = np.arange(len(queries))
    
    plt.bar(x - bar_width/2, labse_times, bar_width, label='LaBSE', color='skyblue')
    plt.bar(x + bar_width/2, bge_times, bar_width, label='BGE', color='lightcoral')
    
    plt.xlabel('검색 쿼리')
    plt.ylabel('처리 시간 (초)')
    plt.title('LaBSE vs BGE: 쿼리별 처리 시간 비교')
    plt.xticks(x, short_queries, rotation=45, ha='right')
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    plt.savefig('query_times.png', dpi=300)
    
    # 전체 시간 비교
    plt.figure(figsize=(8, 6))
    
    plt.bar(['LaBSE', 'BGE'], [results["labse"]["total_time"], results["bge"]["total_time"]], color=['skyblue', 'lightcoral'])
    plt.xlabel('임베딩 모델')
    plt.ylabel('총 처리 시간 (초)')
    plt.title('LaBSE vs BGE: 총 처리 시간 비교')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    for i, v in enumerate([results["labse"]["total_time"], results["bge"]["total_time"]]):
        plt.text(i, v + 0.1, f'{v:.2f}초', ha='center')
    
    plt.tight_layout()
    plt.savefig('total_times.png', dpi=300)
    
    return {
        'labse_avg': labse_avg,
        'bge_avg': bge_avg,
        'speedup': (labse_avg / bge_avg if bge_avg > 0 else 0) if labse_avg > bge_avg else -(bge_avg / labse_avg if labse_avg > 0 else 0)
    }

def analyze_result_overlap(results):
    """결과 일치도 분석"""
    overlaps = []
    queries = []
    
    # 기본 쿼리만 추출
    for query in results["labse"]["queries"]:
        if "직업" not in query:
            queries.append(query)
            
            labse_ids = [r["id"] for r in results["labse"]["queries"][query]["top_results"]]
            bge_ids = [r["id"] for r in results["bge"]["queries"][query]["top_results"]]
            
            overlap = len(set(labse_ids) & set(bge_ids))
            overlaps.append(overlap / len(labse_ids) if labse_ids else 0)
    
    # 쿼리 레이블 축약
    short_queries = []
    for q in queries:
        if len(q) > 15:
            words = q.split()
            if len(words) > 2:
                short_queries.append(' '.join(words[:2]) + '...')
            else:
                short_queries.append(q[:15] + '...')
        else:
            short_queries.append(q)
    
    # 일치도 그래프
    plt.figure(figsize=(14, 7))
    
    plt.bar(short_queries, overlaps, color='mediumpurple')
    plt.axhline(y=np.mean(overlaps), color='r', linestyle='--', label=f'평균 일치도: {np.mean(overlaps):.2f}')
    
    plt.xlabel('검색 쿼리')
    plt.ylabel('결과 일치도')
    plt.title('LaBSE vs BGE: 결과 일치도')
    plt.xticks(rotation=45, ha='right')
    plt.gca().yaxis.set_major_formatter(PercentFormatter(1.0))
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    plt.savefig('result_overlap.png', dpi=300)
    
    return {
        'avg_overlap': np.mean(overlaps),
        'max_overlap': np.max(overlaps),
        'min_overlap': np.min(overlaps)
    }

def analyze_similarity_distributions(results):
    """유사도 점수 분포 분석"""
    labse_similarities = []
    bge_similarities = []
    
    # 모든 쿼리의 유사도 점수 수집
    for query, data in results["labse"]["queries"].items():
        labse_similarities.extend([r["similarity"] for r in data["top_results"]])
    
    for query, data in results["bge"]["queries"].items():
        bge_similarities.extend([r["similarity"] for r in data["top_results"]])
    
    # 유사도 분포 그래프
    plt.figure(figsize=(12, 6))
    
    plt.hist(labse_similarities, alpha=0.5, bins=20, label='LaBSE', color='skyblue')
    plt.hist(bge_similarities, alpha=0.5, bins=20, label='BGE', color='lightcoral')
    
    plt.xlabel('유사도 점수')
    plt.ylabel('빈도')
    plt.title('LaBSE vs BGE: 유사도 점수 분포')
    plt.legend()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    
    plt.savefig('similarity_distribution.png', dpi=300)
    
    return {
        'labse_avg_similarity': np.mean(labse_similarities),
        'bge_avg_similarity': np.mean(bge_similarities),
        'labse_max_similarity': np.max(labse_similarities),
        'bge_max_similarity': np.max(bge_similarities)
    }

def main():
    # 한글 폰트 설정
    set_korean_font()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    results_path = os.path.join(base_dir, "data", "benchmark_results.json")
    
    if not os.path.exists(results_path):
        print(f"벤치마크 결과 파일을 찾을 수 없습니다: {results_path}")
        print("먼저 benchmark_embeddings.py를 실행하세요.")
        return
    
    # 결과 디렉토리 생성
    output_dir = os.path.join(base_dir, "data", "benchmark_analysis")
    os.makedirs(output_dir, exist_ok=True)
    
    # 현재 작업 디렉토리 변경
    original_dir = os.getcwd()
    os.chdir(output_dir)
    
    # 벤치마크 결과 로드
    results = load_benchmark_results(results_path)
    
    # 분석 실행
    speed_metrics = analyze_speed(results)
    overlap_metrics = analyze_result_overlap(results)
    similarity_metrics = analyze_similarity_distributions(results)
    
    # 요약 보고서 생성
    report = {
        "speed_comparison": speed_metrics,
        "result_overlap": overlap_metrics,
        "similarity_scores": similarity_metrics
    }
    
    # 보고서 저장
    with open('summary_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 요약 출력
    print("\n==== 벤치마크 분석 결과 ====")
    print(f"분석 결과가 저장된 경로: {output_dir}")
    
    print("\n1. 처리 속도 비교")
    print(f"LaBSE 평균 처리 시간: {speed_metrics['labse_avg']:.4f}초")
    print(f"BGE 평균 처리 시간: {speed_metrics['bge_avg']:.4f}초")
    if speed_metrics['speedup'] > 0:
        print(f"BGE가 LaBSE보다 {speed_metrics['speedup']:.2f}배 빠름")
    else:
        print(f"LaBSE가 BGE보다 {-speed_metrics['speedup']:.2f}배 빠름")
    
    print("\n2. 결과 일치도")
    print(f"평균 일치도: {overlap_metrics['avg_overlap']:.2%}")
    print(f"최대 일치도: {overlap_metrics['max_overlap']:.2%}")
    print(f"최소 일치도: {overlap_metrics['min_overlap']:.2%}")
    
    print("\n3. 유사도 점수")
    print(f"LaBSE 평균 유사도: {similarity_metrics['labse_avg_similarity']:.4f}")
    print(f"BGE 평균 유사도: {similarity_metrics['bge_avg_similarity']:.4f}")
    print(f"LaBSE 최대 유사도: {similarity_metrics['labse_max_similarity']:.4f}")
    print(f"BGE 최대 유사도: {similarity_metrics['bge_max_similarity']:.4f}")
    
    # 작업 디렉토리 복원
    os.chdir(original_dir)
    
    print("\n분석이 완료되었습니다. 그래프가 저장된 경로를 확인하세요.")
    print(f"그래프 저장 경로: {output_dir}")

if __name__ == "__main__":
    main() 