"""
S3 연결 테스트 스크립트
S3 버킷 접근 및 로그 파일 확인
"""

import os
from dotenv import load_dotenv
from s3_log_loader import S3WafLogLoader

# .env 파일 로드
load_dotenv()

def test_s3_connection():
    """S3 연결 및 로그 파일 확인"""
    
    print("="*60)
    print("🧪 S3 연결 테스트 시작")
    print("="*60)
    
    # 환경 변수 확인
    use_s3 = os.environ.get('USE_S3_LOGS', 'false').lower() == 'true'
    s3_bucket = os.environ.get('S3_BUCKET_NAME', '')
    s3_region = os.environ.get('S3_REGION', 'ap-northeast-2')
    
    print(f"\n📋 환경 변수 설정:")
    print(f"   USE_S3_LOGS: {use_s3}")
    print(f"   S3_BUCKET_NAME: {s3_bucket}")
    print(f"   S3_REGION: {s3_region}")
    
    if not use_s3:
        print("\n⚠️  USE_S3_LOGS=false로 설정되어 있습니다.")
        print("   .env 파일에서 USE_S3_LOGS=true로 변경하세요.")
        return
    
    if not s3_bucket:
        print("\n❌ S3_BUCKET_NAME이 설정되지 않았습니다.")
        return
    
    # S3 로그 로더 초기화
    print(f"\n🔌 S3 클라이언트 초기화 중...")
    loader = S3WafLogLoader(bucket_name=s3_bucket, region=s3_region)
    
    if not loader.s3_client:
        print("\n❌ S3 클라이언트 초기화 실패")
        print("   AWS 자격 증명을 확인하세요:")
        print("   1. aws configure")
        print("   2. 환경 변수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY")
        print("   3. IAM Role (EC2/Lambda)")
        return
    
    # 최근 1시간의 로그 파일 확인
    print(f"\n📂 최근 1시간의 로그 파일 확인 중...")
    prefixes = loader.get_log_prefixes(hours_back=1)
    
    total_files = 0
    for prefix in prefixes:
        log_files = loader.list_log_files(prefix, max_files=5)
        if log_files:
            print(f"\n   📁 {prefix}")
            print(f"      파일 개수: {len(log_files)}개")
            for log_file in log_files[:3]:  # 처음 3개만 표시
                print(f"      - {os.path.basename(log_file)}")
            if len(log_files) > 3:
                print(f"      ... 외 {len(log_files) - 3}개")
            total_files += len(log_files)
    
    if total_files == 0:
        print("\n⚠️  최근 1시간 동안 로그 파일이 없습니다.")
        print("   더 넓은 범위를 확인해보세요:")
        print("   - 최근 24시간: hours_back=24")
        print("   - 최근 7일: hours_back=168")
        return
    
    print(f"\n✅ 총 {total_files}개의 로그 파일을 발견했습니다.")
    
    # 샘플 로그 다운로드 테스트
    print(f"\n📥 샘플 로그 다운로드 테스트...")
    for prefix in prefixes:
        log_files = loader.list_log_files(prefix, max_files=1)
        if log_files:
            sample_file = log_files[0]
            print(f"   파일: {os.path.basename(sample_file)}")
            
            # 다운로드 및 압축 해제
            log_content = loader.download_and_decompress_log(sample_file)
            
            if log_content:
                # 로그 파싱
                log_entries = loader.parse_log_content(log_content)
                print(f"   ✅ {len(log_entries)}개의 로그 엔트리 파싱 완료")
                
                if log_entries:
                    print(f"\n📋 샘플 로그 (첫 번째 엔트리):")
                    print("   " + "-"*56)
                    import json
                    sample_log = json.dumps(log_entries[0], indent=2, ensure_ascii=False)
                    for line in sample_log.split('\n')[:20]:  # 처음 20줄만
                        print(f"   {line}")
                    if len(sample_log.split('\n')) > 20:
                        print("   ...")
                
                break
    
    print("\n" + "="*60)
    print("✅ S3 연결 테스트 완료!")
    print("="*60)
    print("\n다음 단계:")
    print("1. python api_server.py - API 서버 시작 (자동으로 S3 로그 로드)")
    print("2. cd frontend && npm start - 프론트엔드 시작")
    print("3. http://localhost:3000 - 브라우저에서 확인")


if __name__ == '__main__':
    test_s3_connection()
