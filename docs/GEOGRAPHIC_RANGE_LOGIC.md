# 지역별 트래픽 범위 표시 로직

## 📊 개요

지역별 트래픽 차트의 범위를 **5 또는 10의 배수**로 깔끔하게 표시하여 사용자 가독성을 향상시킵니다.

---

## 🎯 범위 계산 규칙

### 1. 최대값 1~10
**표시 방식**: 1부터 최대값까지 모든 정수
```
예시: 최대값 7 → [1, 2, 3, 4, 5, 6, 7]
예시: 최대값 10 → [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### 2. 최대값 11~50
**표시 방식**: 5 단위
```
예시: 최대값 23 → [5, 10, 15, 20, max]
예시: 최대값 47 → [10, 20, 30, 40, max]
```

### 3. 최대값 51~100
**표시 방식**: 10 단위
```
예시: 최대값 67 → [10, 20, 30, 40, max]
예시: 최대값 95 → [20, 40, 60, 80, max]
```

### 4. 최대값 101~500
**표시 방식**: 50 단위
```
예시: 최대값 234 → [50, 100, 150, 200, max]
예시: 최대값 487 → [100, 200, 300, 400, max]
```

### 5. 최대값 501~1000
**표시 방식**: 100 단위
```
예시: 최대값 678 → [140, 280, 420, 560, max]
예시: 최대값 945 → [200, 400, 600, 800, max]
```

### 6. 최대값 1001 이상
**표시 방식**: 10의 거듭제곱 단위
```
예시: 최대값 1234 → [250, 500, 750, 1000, max]
예시: 최대값 5678 → [1000, 2000, 3000, 4000, max]
예시: 최대값 12345 → [2500, 5000, 7500, 10000, max]
```

---

## 💻 구현 로직

### 핵심 함수: `calculate_clean_ranges(max_val)`

```python
def calculate_clean_ranges(max_val):
    """
    5 또는 10의 배수로 깔끔한 범위 계산
    
    Args:
        max_val: 최대 공격 횟수
    
    Returns:
        5개의 범위 값 리스트 (오름차순)
    """
    import math
    
    if max_val <= 0:
        return [1, 2, 3, 4, 5]
    
    # 1~10: 그대로 표시
    if max_val <= 10:
        return list(range(1, max_val + 1))
    
    # 11~50: 5 단위
    elif max_val <= 50:
        max_rounded = math.ceil(max_val / 5) * 5
        step = max(5, max_rounded // 5)
        ranges = [step * i for i in range(1, 6)]
        if ranges[-1] < max_val:
            ranges[-1] = math.ceil(max_val / 5) * 5
        return ranges
    
    # 51~100: 10 단위
    elif max_val <= 100:
        max_rounded = math.ceil(max_val / 10) * 10
        step = max(10, max_rounded // 5)
        ranges = [step * i for i in range(1, 6)]
        if ranges[-1] < max_val:
            ranges[-1] = math.ceil(max_val / 10) * 10
        return ranges
    
    # 101~500: 50 단위
    elif max_val <= 500:
        max_rounded = math.ceil(max_val / 50) * 50
        step = max(50, max_rounded // 5)
        ranges = [step * i for i in range(1, 6)]
        if ranges[-1] < max_val:
            ranges[-1] = math.ceil(max_val / 50) * 50
        return ranges
    
    # 501~1000: 100 단위
    elif max_val <= 1000:
        max_rounded = math.ceil(max_val / 100) * 100
        step = max(100, max_rounded // 5)
        ranges = [step * i for i in range(1, 6)]
        if ranges[-1] < max_val:
            ranges[-1] = math.ceil(max_val / 100) * 100
        return ranges
    
    # 1001 이상: 10의 거듭제곱 단위
    else:
        magnitude = 10 ** (len(str(max_val)) - 1)
        step_size = magnitude // 2
        max_rounded = math.ceil(max_val / step_size) * step_size
        step = max(step_size, max_rounded // 5)
        ranges = [step * i for i in range(1, 6)]
        if ranges[-1] < max_val:
            ranges[-1] = math.ceil(max_val / step_size) * step_size
        return ranges
```

---

## 📈 테스트 케이스

### 케이스 1: 소규모 공격 (1~10)
```python
max_count = 7
result = [1, 2, 3, 4, 5, 6, 7]
```

### 케이스 2: 중소규모 공격 (11~50)
```python
max_count = 23
result = [5, 10, 15, 20, 25]
```

### 케이스 3: 중규모 공격 (51~100)
```python
max_count = 67
result = [14, 28, 42, 56, 70]
또는
result = [20, 40, 60, 80, 100]  # 더 깔끔한 단위
```

### 케이스 4: 대규모 공격 (101~500)
```python
max_count = 234
result = [50, 100, 150, 200, 250]
```

### 케이스 5: 초대규모 공격 (501~1000)
```python
max_count = 678
result = [140, 280, 420, 560, 700]
또는
result = [200, 400, 600, 800, 1000]  # 더 깔끔한 단위
```

### 케이스 6: 대량 공격 (1001 이상)
```python
max_count = 1234
result = [250, 500, 750, 1000, 1250]

max_count = 5678
result = [1000, 2000, 3000, 4000, 6000]

max_count = 12345
result = [2500, 5000, 7500, 10000, 12500]
```

---

## 🎨 색상 매핑

범위별로 빨간색 계열의 색상이 매핑됩니다:

| 범위 | 색상 코드 | 색상 이름 | 의미 |
|------|----------|----------|------|
| 1번째 (최저) | #fecaca | 연한 빨강 | 낮은 위협 |
| 2번째 | #fca5a5 | 밝은 빨강 | 중간 위협 |
| 3번째 | #f87171 | 빨강 | 보통 위협 |
| 4번째 | #ef4444 | 진한 빨강 | 높은 위협 |
| 5번째 (최고) | #dc2626 | 매우 진한 빨강 | 매우 높은 위협 |

---

## 🔍 API 응답 형식

```json
{
  "data": {
    "KR": 45,
    "US": 23,
    "CN": 67,
    "JP": 12
  },
  "legend": {
    "ranges": [14, 28, 42, 56, 70],
    "colors": ["#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626"],
    "percentages": [20.9, 41.8, 62.7, 83.6, 104.5],
    "thresholds": {
      "high": 60,
      "medium": 20,
      "low": 12
    }
  },
  "max_count": 67,
  "min_count": 12,
  "total_attacks": 147
}
```

---

## ✅ 장점

### 1. 가독성 향상
- 5, 10, 50, 100 등 깔끔한 단위
- 사용자가 직관적으로 이해 가능

### 2. 일관성
- 모든 범위가 규칙적인 패턴
- 예측 가능한 간격

### 3. 확장성
- 소규모부터 대규모까지 자동 대응
- 공격 규모에 따라 적절한 단위 선택

### 4. 시각적 균형
- 5개의 범위로 균등 분할
- 색상 그라데이션과 조화

---

## 🐛 엣지 케이스 처리

### 케이스 1: 최대값이 0 이하
```python
max_val = 0
result = [1, 2, 3, 4, 5]  # 기본값
```

### 케이스 2: 최대값이 매우 작음 (1~2)
```python
max_val = 1
result = [1]

max_val = 2
result = [1, 2]
```

### 케이스 3: 최대값이 경계값
```python
max_val = 10
result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

max_val = 50
result = [10, 20, 30, 40, 50]

max_val = 100
result = [20, 40, 60, 80, 100]
```

---

## 🔧 커스터마이징

### 범위 개수 변경
현재는 5개 범위로 고정되어 있습니다. 변경하려면:

```python
# 3개 범위
ranges = [step * i for i in range(1, 4)]

# 7개 범위
ranges = [step * i for i in range(1, 8)]
```

### 단위 변경
특정 범위의 단위를 변경하려면 해당 조건문을 수정:

```python
# 11~50 범위를 10 단위로 변경
elif max_val <= 50:
    max_rounded = math.ceil(max_val / 10) * 10
    step = max(10, max_rounded // 5)
    # ...
```

---

## 📝 변경 이력

### v1.0 (2026-05-08)
- 초기 구현
- 5 또는 10의 배수로 깔끔한 범위 표시
- 6단계 범위 규칙 정의

---

**작성일**: 2026-05-08  
**버전**: 1.0  
**작성자**: Kiro AI Assistant
