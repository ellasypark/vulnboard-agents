"""
S3 WAF 로그 로더
S3 버킷에서 WAF 로그를 다운로드하고 파싱하는 모듈
"""

import boto3
import gzip
import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError, NoCredentialsError


class S3WafLogLoader:
    """S3에서 WAF 로그를 가져오는 클래스"""
    
    def __init__(self, bucket_name: str, region: str = 'ap-northeast-2'):
        """
        S3 WAF 로그 로더 초기화
        
        Args:
            bucket_name: S3 버킷 이름 (예: 'aws-waf-logs-attack-683123960885-ap-northeast-2-an')
            region: AWS 리전 (기본값: 'ap-northeast-2')
        """
        self.bucket_name = bucket_name
        self.region = region
        self.s3_client = None
        self._initialize_s3_client()
    
    def _initialize_s3_client(self):
        """S3 클라이언트 초기화"""
        try:
            # AWS 자격 증명은 환경 변수, ~/.aws/credentials, IAM Role 등에서 자동으로 가져옴
            self.s3_client = boto3.client('s3', region_name=self.region)
            print(f"✅ S3 클라이언트 초기화 완료 (리전: {self.region})")
        except NoCredentialsError:
            print("❌ AWS 자격 증명을 찾을 수 없습니다.")
            print("   다음 중 하나를 설정하세요:")
            print("   1. AWS CLI: aws configure")
            print("   2. 환경 변수: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY")
            print("   3. IAM Role (EC2/Lambda에서 실행 시)")
            self.s3_client = None
        except Exception as e:
            print(f"❌ S3 클라이언트 초기화 실패: {e}")
            self.s3_client = None
    
    def get_log_prefixes(self, hours_back: int = 24) -> List[str]:
        """
        최근 N시간 동안의 로그 디렉토리 경로 생성
        
        Args:
            hours_back: 조회할 시간 범위 (기본값: 24시간)
        
        Returns:
            S3 prefix 리스트 (예: ['2026/05/08/09/', '2026/05/08/10/', ...])
        """
        prefixes = []
        now = datetime.now()
        
        for i in range(hours_back):
            target_time = now - timedelta(hours=i)
            prefix = target_time.strftime('%Y/%m/%d/%H/')
            prefixes.append(prefix)
        
        return prefixes
    
    def list_log_files(self, prefix: str, max_files: int = 100) -> List[str]:
        """
        특정 prefix 아래의 로그 파일 목록 조회
        
        Args:
            prefix: S3 prefix (예: '2026/05/08/09/')
            max_files: 최대 파일 개수 (기본값: 100)
        
        Returns:
            S3 객체 키 리스트
        """
        if not self.s3_client:
            print("⚠️  S3 클라이언트가 초기화되지 않았습니다.")
            return []
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_files
            )
            
            if 'Contents' not in response:
                return []
            
            # .gz 파일만 필터링
            log_files = [
                obj['Key'] for obj in response['Contents']
                if obj['Key'].endswith('.gz')
            ]
            
            return log_files
        
        except ClientError as e:
            print(f"❌ S3 파일 목록 조회 실패 (prefix: {prefix}): {e}")
            return []
    
    def download_and_decompress_log(self, s3_key: str) -> Optional[str]:
        """
        S3에서 로그 파일 다운로드 및 압축 해제
        
        Args:
            s3_key: S3 객체 키 (예: '2026/05/08/09/aws-waf-logs-...-...-...-....gz')
        
        Returns:
            압축 해제된 로그 내용 (문자열)
        """
        if not self.s3_client:
            print("⚠️  S3 클라이언트가 초기화되지 않았습니다.")
            return None
        
        try:
            # S3에서 파일 다운로드
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            # gzip 압축 해제
            compressed_data = response['Body'].read()
            decompressed_data = gzip.decompress(compressed_data)
            log_content = decompressed_data.decode('utf-8')
            
            return log_content
        
        except ClientError as e:
            print(f"❌ S3 파일 다운로드 실패 (key: {s3_key}): {e}")
            return None
        except Exception as e:
            print(f"❌ 로그 압축 해제 실패 (key: {s3_key}): {e}")
            return None
    
    def parse_log_content(self, log_content: str) -> List[Dict[str, Any]]:
        """
        로그 내용을 파싱하여 JSON 객체 리스트로 변환
        
        Args:
            log_content: 압축 해제된 로그 내용
        
        Returns:
            JSON 로그 엔트리 리스트
        """
        log_entries = []
        
        # 각 줄이 개별 JSON 객체인 경우 (JSONL 형식)
        for line in log_content.strip().split('\n'):
            if not line.strip():
                continue
            
            try:
                log_entry = json.loads(line)
                log_entries.append(log_entry)
            except json.JSONDecodeError as e:
                print(f"⚠️  JSON 파싱 실패: {e}")
                continue
        
        return log_entries
    
    def load_logs_from_s3(
        self, 
        hours_back: int = 24, 
        max_files_per_hour: int = 10,
        max_total_logs: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        S3에서 WAF 로그를 로드
        
        Args:
            hours_back: 조회할 시간 범위 (기본값: 24시간)
            max_files_per_hour: 시간당 최대 파일 개수 (기본값: 10)
            max_total_logs: 최대 로그 개수 (기본값: 1000)
        
        Returns:
            WAF 로그 엔트리 리스트
        """
        if not self.s3_client:
            print("❌ S3 클라이언트를 사용할 수 없습니다. 샘플 데이터를 사용하세요.")
            return []
        
        all_logs = []
        prefixes = self.get_log_prefixes(hours_back)
        
        print(f"📂 S3 버킷에서 로그 로드 시작...")
        print(f"   버킷: {self.bucket_name}")
        print(f"   조회 범위: 최근 {hours_back}시간")
        
        for prefix in prefixes:
            if len(all_logs) >= max_total_logs:
                print(f"⚠️  최대 로그 개수({max_total_logs})에 도달했습니다.")
                break
            
            # 해당 시간대의 로그 파일 목록 조회
            log_files = self.list_log_files(prefix, max_files_per_hour)
            
            if not log_files:
                continue
            
            print(f"   📁 {prefix}: {len(log_files)}개 파일 발견")
            
            # 각 파일 다운로드 및 파싱
            for log_file in log_files:
                if len(all_logs) >= max_total_logs:
                    break
                
                # 로그 파일 다운로드 및 압축 해제
                log_content = self.download_and_decompress_log(log_file)
                
                if not log_content:
                    continue
                
                # 로그 파싱
                log_entries = self.parse_log_content(log_content)
                all_logs.extend(log_entries)
                
                print(f"      ✅ {os.path.basename(log_file)}: {len(log_entries)}개 로그")
        
        print(f"✅ 총 {len(all_logs)}개의 로그를 로드했습니다.")
        return all_logs
    
    def save_logs_to_file(self, logs: List[Dict[str, Any]], output_file: str = 'waf_logs.json'):
        """
        로그를 로컬 파일로 저장 (JSONL 형식)
        
        Args:
            logs: WAF 로그 엔트리 리스트
            output_file: 출력 파일 경로 (기본값: 'waf_logs.json')
        """
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                for log in logs:
                    f.write(json.dumps(log, ensure_ascii=False) + '\n')
            
            print(f"✅ 로그를 {output_file}에 저장했습니다. ({len(logs)}개)")
        except Exception as e:
            print(f"❌ 로그 저장 실패: {e}")


def main():
    """테스트 및 로그 다운로드 스크립트"""
    
    # S3 버킷 설정
    BUCKET_NAME = 'aws-waf-logs-attack-683123960885-ap-northeast-2-an'
    REGION = 'ap-northeast-2'
    
    # 로그 로더 초기화
    loader = S3WafLogLoader(bucket_name=BUCKET_NAME, region=REGION)
    
    # S3에서 로그 로드 (최근 24시간)
    logs = loader.load_logs_from_s3(
        hours_back=24,           # 최근 24시간
        max_files_per_hour=10,   # 시간당 최대 10개 파일
        max_total_logs=1000      # 최대 1000개 로그
    )
    
    if logs:
        # 로컬 파일로 저장
        loader.save_logs_to_file(logs, 'waf_logs.json')
        
        # 샘플 로그 출력
        print("\n" + "="*60)
        print("📋 샘플 로그 (첫 번째 엔트리):")
        print("="*60)
        print(json.dumps(logs[0], indent=2, ensure_ascii=False))
    else:
        print("⚠️  로드된 로그가 없습니다.")


if __name__ == '__main__':
    main()
