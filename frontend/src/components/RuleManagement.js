import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RuleManagement.css';

function RuleManagement({ aiRules, attackTypeColors, isDarkMode }) {
  // 상태 관리
  const [suggestedRules, setSuggestedRules] = useState([]);
  const [appliedRules, setAppliedRules] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(75);
  const [maxRisk, setMaxRisk] = useState(75);
  const [minRisk, setMinRisk] = useState(25);
  const [riskReductionMap, setRiskReductionMap] = useState({});
  const [selectedRule, setSelectedRule] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 초기화
  useEffect(() => {
    if (aiRules && aiRules.length > 0) {
      setSuggestedRules(aiRules);
      loadRiskCalculation();
    }
  }, [aiRules]);

  // 위험도 계산 정보 로드
  const loadRiskCalculation = async () => {
    try {
      const response = await axios.get('/api/risk-calculation');
      if (response.data.success) {
        // 새로운 범위: max (50~100), min (0~50)
        const maxRiskValue = Math.max(response.data.max_risk, 50);
        const minRiskValue = Math.max(response.data.min_risk, 0);
        const currentRiskValue = Math.max(response.data.current_risk, 50);
        
        setMaxRisk(maxRiskValue);
        setMinRisk(minRiskValue);
        setCurrentRisk(currentRiskValue);
        
        // 룰별 위험도 감소량 맵 생성 (음수 방어)
        const reductionMap = {};
        response.data.risk_reduction_per_rule.forEach(item => {
          // 절대 음수가 나오지 않도록 방어
          const reduction = Math.max(item.reduction, 0);
          // 소수점 첫째 자리로 반올림
          reductionMap[item.rule_id] = Math.round(reduction * 10) / 10;
        });
        setRiskReductionMap(reductionMap);
        
        // 디버그 정보 출력
        console.log('위험도 계산 결과 (v3.0 - 룰 기반):', {
          max_risk: maxRiskValue,
          min_risk: minRiskValue,
          current_risk: currentRiskValue,
          applied_safety_score: response.data.applied_safety_score,
          potential_safety_score: response.data.potential_safety_score,
          applied_rule_count: response.data.applied_rule_count,
          suggested_rule_count: response.data.suggested_rule_count,
          total_rule_count: response.data.total_rule_count,
          calculation_method: response.data.calculation_method,
          risk_reduction_map: reductionMap
        });
      }
    } catch (error) {
      console.error('위험도 계산 로드 오류:', error);
    }
  };

  // 카테고리에서 색상 가져오기 (도넛 그래프 색상과 완전히 통일)
  const getCategoryColor = (category) => {
    const colorMap = attackTypeColors || {};
    
    // 카테고리 → 공격 유형 매핑 (도넛 그래프와 동일한 색상 사용)
    const categoryToAttackType = {
      'IP Reputation': 'IP Reputation',
      'Common Vulnerabilities': 'Common Vulnerabilities',
      'Known Bad Inputs': 'Known Bad Inputs',
      'SQL Injection Protection': 'SQL Injection',
      'Linux Protection': 'Linux Protection',
      'Unix Protection': 'Unix Protection',
      'Rate Limiting': 'Rate Limiting',
      'Geo Blocking': 'Geo Blocking'
    };

    // 매핑된 공격 유형의 색상 가져오기
    const attackType = categoryToAttackType[category];
    const color = attackType && colorMap[attackType] ? colorMap[attackType] : '#6b7280';
    
    // 디버그: 색상 매핑 확인
    if (process.env.NODE_ENV === 'development') {
      console.log(`카테고리 "${category}" → 공격 유형 "${attackType}" → 색상 "${color}"`);
    }

    return color;
  };

  // 상세 보기 모달 열기
  const openModal = (rule) => {
    setSelectedRule(rule);
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSelectedRule(null);
  };

  // 룰 적용 (AI 제안 -> 적용된 룰)
  const applyRule = async () => {
    if (!selectedRule) return;

    try {
      const response = await axios.post('/api/apply-rule', {
        rule_id: selectedRule.id
      });

      if (response.data.success) {
        // 좌측에서 제거
        setSuggestedRules(prev => prev.filter(r => r.id !== selectedRule.id));
        
        // 중앙에 추가
        setAppliedRules(prev => [...prev, selectedRule]);
        
        // 위험도 감소 (뺄셈) - 음수 방어 및 소수점 처리
        const reduction = Math.max(riskReductionMap[selectedRule.id] || 0, 0);
        const newRisk = Math.max(currentRisk - reduction, minRisk);
        setCurrentRisk(Math.round(newRisk * 10) / 10);
        
        closeModal();
        alert(`✅ ${selectedRule.name} 룰이 적용되었습니다.\n위험도 -${reduction.toFixed(1)}점 감소`);
      }
    } catch (error) {
      console.error('룰 적용 오류:', error);
      alert('❌ 룰 적용 중 오류가 발생했습니다.');
    }
  };

  // 룰 제거 (적용된 룰 -> AI 제안)
  const removeRule = async (rule) => {
    const confirmed = window.confirm(`${rule.name} 룰을 제거하시겠습니까?`);
    if (!confirmed) return;

    try {
      const response = await axios.post('/api/remove-rule', {
        rule_id: rule.id
      });

      if (response.data.success) {
        // 중앙에서 제거
        setAppliedRules(prev => prev.filter(r => r.id !== rule.id));
        
        // 좌측에 추가
        setSuggestedRules(prev => [...prev, rule]);
        
        // 위험도 증가 (덧셈) - 음수 방어 및 소수점 처리
        const reduction = Math.max(riskReductionMap[rule.id] || 0, 0);
        const newRisk = Math.min(currentRisk + reduction, maxRisk);
        setCurrentRisk(Math.round(newRisk * 10) / 10);
        
        alert(`✅ ${rule.name} 룰이 제거되었습니다.\n위험도 +${reduction.toFixed(1)}점 증가`);
      }
    } catch (error) {
      console.error('룰 제거 오류:', error);
      alert('❌ 룰 제거 중 오류가 발생했습니다.');
    }
  };

  // 위험도 레벨 계산
  const getRiskLevel = () => {
    if (currentRisk >= 70) return { level: 'HIGH', color: '#dc2626', label: '높음' };
    if (currentRisk >= 40) return { level: 'MEDIUM', color: '#f59e0b', label: '중간' };
    return { level: 'LOW', color: '#10b981', label: '낮음' };
  };

  const riskInfo = getRiskLevel();

  return (
    <div className="rule-management-container">
      <h2 className="section-title">
        <i className="fas fa-shield-alt"></i> WAF 룰 관리
      </h2>

      <div className="rule-management-grid">
        {/* 좌측: AI 제안 룰 */}
        <div className="rule-column suggested-rules">
          <div className="column-header">
            <h3><i className="fas fa-robot"></i> AI 제안 룰</h3>
            <span className="rule-count">{suggestedRules.length}개</span>
          </div>
          <div className="rule-list">
            {suggestedRules.length > 0 ? (
              suggestedRules.map((rule) => (
                <div key={rule.id} className="rule-card">
                  <div className="rule-header">
                    <span className="rule-name">{rule.name}</span>
                    <span className="rule-wcu">{rule.wcu} WCU</span>
                  </div>
                  <div className="rule-tags">
                    <span 
                      className="rule-tag" 
                      style={{ 
                        backgroundColor: getCategoryColor(rule.category),
                        color: 'white'
                      }}
                    >
                      {rule.category}
                    </span>
                  </div>
                  <div className="rule-stats">
                    <span><i className="fas fa-exclamation-circle"></i> {rule.total_detections || 0}건 탐지</span>
                    <span className="risk-reduction">-{Math.max(riskReductionMap[rule.id] || 0, 0).toFixed(1)}점</span>
                  </div>
                  <button 
                    className="detail-btn"
                    onClick={() => openModal(rule)}
                  >
                    <i className="fas fa-info-circle"></i> 상세 보기
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>모든 AI 추천 룰이 적용되었습니다!</p>
              </div>
            )}
          </div>
        </div>

        {/* 중앙: 적용된 룰 */}
        <div className="rule-column applied-rules">
          <div className="column-header">
            <h3><i className="fas fa-check-circle"></i> 적용된 룰</h3>
            <span className="rule-count">{appliedRules.length}개</span>
          </div>
          <div className="rule-list">
            {appliedRules.length > 0 ? (
              appliedRules.map((rule) => (
                <div key={rule.id} className="rule-card applied">
                  <div className="rule-header">
                    <span className="rule-name">{rule.name}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => removeRule(rule)}
                      title="룰 제거"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="rule-tags">
                    <span 
                      className="rule-tag" 
                      style={{ 
                        backgroundColor: getCategoryColor(rule.category),
                        color: 'white'
                      }}
                    >
                      {rule.category}
                    </span>
                  </div>
                  <div className="rule-stats">
                    <span><i className="fas fa-shield-alt"></i> 활성화됨</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="fas fa-info-circle"></i>
                <p>적용된 룰이 없습니다.</p>
                <p className="empty-hint">좌측의 AI 제안 룰을 검토하고 적용하세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 통합 종합 시스템 위험도 */}
        <div className="rule-column risk-gauge">
          <div className="column-header">
            <h3><i className="fas fa-tachometer-alt"></i> 종합 시스템 위험도</h3>
          </div>
          <div className="risk-display">
            <div className="risk-circle" style={{ borderColor: riskInfo.color }}>
              <div className="risk-value" style={{ color: riskInfo.color }}>
                {currentRisk.toFixed(1)}
              </div>
              <div className="risk-label">{riskInfo.label}</div>
            </div>
            
            <div className="risk-bar-container">
              <div className="risk-bar-labels">
                <span>최저 ({minRisk})</span>
                <span>최고 ({maxRisk})</span>
              </div>
              <div className="risk-bar">
                <div 
                  className="risk-bar-fill" 
                  style={{ 
                    width: `${((currentRisk - minRisk) / (maxRisk - minRisk)) * 100}%`,
                    backgroundColor: riskInfo.color
                  }}
                ></div>
              </div>
            </div>

            <div className="risk-info">
              <div className="risk-info-item">
                <span className="info-label">적용된 룰</span>
                <span className="info-value">{appliedRules.length}개</span>
              </div>
              <div className="risk-info-item">
                <span className="info-label">남은 제안</span>
                <span className="info-value">{suggestedRules.length}개</span>
              </div>
              <div className="risk-info-item">
                <span className="info-label">위험도 감소</span>
                <span className="info-value" style={{ color: '#10b981' }}>
                  -{(maxRisk - currentRisk).toFixed(1)}점
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 보기 모달 */}
      {showModal && selectedRule && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedRule.name}</h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h4>기본 정보</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">WCU</span>
                    <span className="info-value">{selectedRule.wcu}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">카테고리</span>
                    <span 
                      className="rule-tag" 
                      style={{ 
                        backgroundColor: getCategoryColor(selectedRule.category),
                        color: 'white'
                      }}
                    >
                      {selectedRule.category}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">위험도 감소</span>
                    <span className="info-value" style={{ color: '#10b981' }}>
                      -{Math.max(riskReductionMap[selectedRule.id] || 0, 0).toFixed(1)}점
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h4>설명</h4>
                <p>{selectedRule.description}</p>
              </div>

              <div className="modal-section">
                <h4>탐지 통계</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">총 탐지</span>
                    <span className="stat-value">{selectedRule.total_detections || 0}건</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">차단</span>
                    <span className="stat-value">{selectedRule.blocked_count || 0}건</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">허용</span>
                    <span className="stat-value">{selectedRule.allowed_count || 0}건</span>
                  </div>
                </div>
              </div>

              {selectedRule.attack_summary && selectedRule.attack_summary.length > 0 && (
                <div className="modal-section">
                  <h4>주요 공격 유형 (Top 5)</h4>
                  <ul className="attack-list">
                    {selectedRule.attack_summary.map((attack, index) => (
                      <li key={index}>{attack}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedRule.improvements && selectedRule.improvements.length > 0 && (
                <div className="modal-section">
                  <h4>AI 개선 사항</h4>
                  <ul className="improvement-list">
                    {selectedRule.improvements.map((improvement, index) => (
                      <li key={index}>
                        <i className="fas fa-check-circle"></i> {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                <i className="fas fa-times"></i> 취소
              </button>
              <button className="btn-apply" onClick={applyRule}>
                <i className="fas fa-check"></i> 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RuleManagement;
