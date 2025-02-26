#!/usr/bin/env python3
"""
임베딩 모델 사용에 필요한 패키지 설치 스크립트
"""
import subprocess
import sys

def install_dependencies():
    """필요한 패키지 설치"""
    dependencies = [
        "sentence-transformers",
        "numpy",
        "tqdm"
    ]
    
    print("Installing dependencies...")
    for dep in dependencies:
        print(f"Installing {dep}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
    
    print("All dependencies installed successfully!")

if __name__ == "__main__":
    install_dependencies() 