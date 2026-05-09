# WAF 룰 변경 Slack 알림 기능 구현 완료

## 📋 구현 개요
WAF 룰 적용/제거 시 AWS SNS를 통해 Slack으로 실시간 알림을 전송하는 기능이 완료되었습니다.

---

## ✅ 완료된 작업

### 1. 프론트엔드 UI 개선 (RuleManagement.js)
- ✅ 모달 닫기 버튼을 우측 상단 'X' 아이콘으로 변경
- ✅ 모달 하단에 '삭제' 버튼 추가 (추천 룰 목록에서 제거)
- ✅ 삭제 버튼 스타일링 (빨간색 #FB4C2E)
- ✅ 삭제 확인 다이얼로그 추가

### 2. 백엔드 SNS 설정 (.env)
```env
# AWS SNS 설정 (Slack 알림용)
SNS_TOPIC_ARN=arn:aws:sns:ap-northeast-2:683123960885:waf-rule-changes
ENABLE_SLACK_NOTIFICATIONS=true
```

### 3. SNS 클라이언트 초기화 (api_server.py)
```python
sns_client = boto3.client("sns", region_name=AWS_REGION)
```

### 4. Slack 알림 함수 구현 (api_server.py)
**함수명**: `send_slack_notification(action, rule_name, details)`

**기능**:
- WAF 룰 적용/제거 시 SNS Topic으로 메시지 발행
- Slack 포맷팅된 메시지 생성
- 에러 발생 시에도 룰 작업은 정상 진행 (알림 실패가 작업을 막지 않음)

**메시지 포맷**:
```
*WAF 룰 변경 알림*

• *액션*: 적용됨 / 제거됨
• *룰 이름*: `AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet`
• *시간*: 2026-05-09 14:30:00
• *WAF*: CreatedByALB-vulnboard-alb
• *Priority*: 10 (적용 시)
• *적용 시간*: 2026-05-09T14:30:00 (적용 시)
```

### 5. API 엔드포인트 업데이트

#### `/api/apply-rule` (POST)
```python
# WAF 룰 적용 후 Slack 알림 전송
send_slack_notification(
    action='applied',
    rule_name=rule_name,
    details={
        'priority': new_priority,
        'applied_at': applied_at
    }
)
```

#### `/api/remove-rule` (POST)
```python
# WAF 룰 제거 후 Slack 알림 전송
send_slack_notification(
    action='removed',
    rule_name=rule_name,
    details={
        'removed_at': datetime.now().isoformat()
    }
)
```

---

## 🔧 AWS SNS 설정 방법

### 1. SNS Topic 생성
```bash
aws sns create-topic --name waf-rule-changes --region ap-northeast-2
```

### 2. Slack Webhook을 SNS 구독으로 추가
AWS Console에서:
1. SNS → Topics → `waf-rule-changes` 선택
2. "Create subscription" 클릭
3. Protocol: HTTPS
4. Endpoint: Slack Incoming Webhook URL 입력
5. "Create subscription" 클릭

또는 AWS Chatbot 사용:
1. AWS Chatbot 콘솔 접속
2. Slack workspace 연결
3. SNS Topic `waf-rule-changes`를 Slack 채널에 연결

### 3. IAM 권한 확인
API 서버가 실행되는 IAM Role/User에 다음 권한 필요:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:ap-northeast-2:683123960885:waf-rule-changes"
    }
  ]
}
```

---

## 📊 알림 예시

### 룰 적용 시
```
✅ WAF 룰 적용됨: AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet

*WAF 룰 변경 알림*

• *액션*: 적용됨
• *룰 이름*: `AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet`
• *시간*: 2026-05-09 14:30:00
• *WAF*: CreatedByALB-vulnboard-alb
• *Priority*: 10
• *적용 시간*: 2026-05-09T14:30:00.123456
```

### 룰 제거 시
```
🗑️ WAF 룰 제거됨: AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet

*WAF 룰 변경 알림*

• *액션*: 제거됨
• *룰 이름*: `AI-Enhanced-AWS-AWSManagedRulesCommonRuleSet`
• *시간*: 2026-05-09 15:45:00
• *WAF*: CreatedByALB-vulnboard-alb
```

---

## 🎯 주요 특징

### 1. 비차단 설계 (Non-blocking)
- 알림 전송 실패 시에도 WAF 룰 적용/제거는 정상 진행
- 에러는 로그로만 기록되고 사용자 작업을 방해하지 않음

### 2. 상세한 메타데이터
- 룰 이름, 액션, 시간, WAF 정보 포함
- Priority, 적용 시간 등 추가 정보 제공

### 3. 환경 변수 제어
- `ENABLE_SLACK_NOTIFICATIONS=false`로 알림 비활성화 가능
- SNS Topic ARN 변경 가능

### 4. 에러 핸들링
```python
try:
    # SNS 메시지 발행
    response = sns_client.publish(...)
    print(f"[SNS] ✅ Slack 알림 전송 완료")
    return True
except Exception as e:
    print(f"[SNS] ⚠️ Slack 알림 전송 실패: {e}")
    return False  # 실패해도 작업은 계속 진행
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
# 백엔드 서버 시작
python api_server.py

# 프론트엔드 서버 시작
cd frontend
npm start
```

### 2. 룰 적용 테스트
1. 대시보드에서 "AI 제안 룰" 카드 클릭
2. "상세 보기" 버튼 클릭
3. "적용" 버튼 클릭
4. Slack 채널에서 알림 확인

### 3. 룰 제거 테스트
1. "적용된 룰" 섹션에서 룰 선택
2. "X" 버튼 클릭하여 제거
3. Slack 채널에서 알림 확인

### 4. SNS 직접 테스트
```python
# Python 콘솔에서 테스트
import boto3
sns = boto3.client('sns', region_name='ap-northeast-2')
response = sns.publish(
    TopicArn='arn:aws:sns:ap-northeast-2:683123960885:waf-rule-changes',
    Subject='테스트 알림',
    Message='SNS 연동 테스트입니다.'
)
print(response['MessageId'])
```

---

## 📝 변경된 파일

### 1. `frontend/src/components/RuleManagement.js`
- 모달 UI 개선 (X 버튼, 삭제 버튼)
- 삭제 확인 로직 추가

### 2. `frontend/src/components/RuleManagement.css`
- `.btn-delete` 스타일 추가
- `.modal-close` 스타일 업데이트

### 3. `.env`
- SNS Topic ARN 추가
- Slack 알림 활성화 플래그 추가

### 4. `api_server.py`
- SNS 클라이언트 초기화
- `send_slack_notification()` 함수 추가
- `/api/apply-rule` 엔드포인트에 알림 추가
- `/api/remove-rule` 엔드포인트에 알림 추가

---

## 🚀 다음 단계 (선택사항)

### 1. 알림 메시지 커스터마이징
- 룰 카테고리별 이모지 변경
- 위험도 감소량 표시
- 적용된 총 룰 개수 표시

### 2. 알림 채널 확장
- Email 알림 추가 (SNS Email 구독)
- Microsoft Teams 연동
- PagerDuty 연동 (긴급 알림)

### 3. 알림 필터링
- 특정 룰만 알림 전송
- 중요도에 따른 알림 채널 분리
- 시간대별 알림 제어

### 4. 알림 이력 관리
- DynamoDB에 알림 이력 저장
- 대시보드에서 알림 이력 조회
- 알림 통계 및 분석

---

## ⚠️ 주의사항

1. **SNS Topic ARN 확인**: `.env` 파일의 SNS_TOPIC_ARN이 올바른지 확인
2. **IAM 권한**: API 서버가 SNS Publish 권한을 가지고 있는지 확인
3. **Slack Webhook**: SNS Topic에 Slack 구독이 올바르게 설정되어 있는지 확인
4. **비용**: SNS 메시지 발행 비용 발생 (매우 저렴하지만 확인 필요)
5. **Rate Limit**: SNS에는 초당 요청 제한이 있으므로 대량 룰 적용 시 주의

---

## 📞 문제 해결

### 알림이 전송되지 않는 경우

1. **SNS 클라이언트 초기화 확인**
```bash
# 서버 로그에서 확인
✅ SNS 클라이언트 초기화 완료: arn:aws:sns:...
```

2. **IAM 권한 확인**
```bash
aws sns publish \
  --topic-arn arn:aws:sns:ap-northeast-2:683123960885:waf-rule-changes \
  --message "테스트" \
  --region ap-northeast-2
```

3. **Slack 구독 확인**
- AWS Console → SNS → Topics → Subscriptions 확인
- Status가 "Confirmed"인지 확인

4. **로그 확인**
```bash
# 서버 로그에서 SNS 관련 메시지 확인
[SNS] ✅ Slack 알림 전송 완료: ...
[SNS] ⚠️ Slack 알림 전송 실패: ...
```

---

## ✨ 완료!

WAF 룰 변경 시 Slack 알림 기능이 완전히 구현되었습니다. 이제 룰을 적용하거나 제거할 때마다 팀원들에게 실시간으로 알림이 전송됩니다! 🎉
