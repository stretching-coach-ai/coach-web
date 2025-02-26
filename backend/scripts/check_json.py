#!/usr/bin/env python3
"""
data.json 파일을 로드하고 구조를 확인하는 스크립트
"""
import json
import os
import sys

def check_json():
    """JSON 파일 로드 및 구조 확인"""
    try:
        # 파일 경로 설정
        script_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(script_dir)
        data_path = os.path.join(base_dir, "data", "data.json")
        
        print(f"파일 경로: {data_path}")
        print(f"파일 크기: {os.path.getsize(data_path)} bytes")
        
        # 파일 로드
        print("JSON 파일 로드 중...")
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        print("JSON 로드 성공!")
        
        # 기본 구조 확인
        print("\n기본 구조:")
        print(f"최상위 키: {list(data.keys())}")
        
        # 메타데이터 확인
        metadata = data.get("metadata", {})
        print("\n메타데이터:")
        print(f"총 항목 수: {metadata.get('total_items')}")
        
        front_muscles = metadata.get("front_muscles", [])
        back_muscles = metadata.get("back_muscles", [])
        print(f"전면 근육 수: {len(front_muscles)}")
        print(f"후면 근육 수: {len(back_muscles)}")
        
        all_muscles = list(set(front_muscles + back_muscles))
        print(f"총 근육 수 (중복 제거): {len(all_muscles)}")
        print(f"모든 근육 목록: {all_muscles}")
        
        # 실제 데이터 확인
        muscles_data = data.get("muscles", {})
        print(f"\n실제 데이터에 있는 근육 수: {len(muscles_data)}")
        print(f"실제 데이터에 있는 근육 목록: {list(muscles_data.keys())}")
        
        # 누락된 근육 확인
        missing_muscles = [m for m in all_muscles if m not in muscles_data]
        print(f"\n누락된 근육 수: {len(missing_muscles)}")
        print(f"누락된 근육 목록: {missing_muscles}")
        
        # 각 근육별 운동 수 확인
        print("\n각 근육별 운동 수:")
        for muscle_name, muscle_data in muscles_data.items():
            exercises = muscle_data.get("exercises", [])
            print(f"- {muscle_name}: {len(exercises)}개 운동")
            
            # 첫 번째 운동의 제목 출력
            if exercises:
                print(f"  첫 번째 운동 제목: {exercises[0].get('title', '제목 없음')}")
        
        return True
        
    except Exception as e:
        print(f"오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_json()
    sys.exit(0 if success else 1) 