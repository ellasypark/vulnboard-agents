import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RuleManagement.css';

function RuleManagement({ aiRules, attackTypeColors, isDarkMode }) {
  const [suggestedRules, setSuggestedRules] = useState([]);
  const [appliedRules, setAppliedRules] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(75);
  const [maxRisk, setMaxRisk] = useState(75);
  const [minRisk, setMinRisk] = useState(25);
  const [riskReductionMap, setRiskReductionMap] = useState({});
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);
  const [selectedRuleType, setSelectedRuleType] = useState('suggested'); // 'suggested' or 'applied'
  const [showModal, setShowModal] = useState(false);
  const [showAllRulesModal, setShowAllRulesModal] = useState(false);

  useEffect(() => {
    if (aiRules && aiRules.length > 0) {
      // ★ AWS WAF 실제 상태 동기화 후 UI 초기화
      syncWithAWS(aiRules);
      loadRiskCalculation();
    }
  }, [aiRules]);

  // ★ 핵심 추가: 페이지 로드 시 AWS WAF 실제 상태와 동기화
  const syncWithAWS = async (rules) => {
    try {
      const response = await axios.get('/api/waf-sync');
      if (response.data.success) {
        const appliedRuleNames = response.data.applied_rules; // AWS에 실제 적용된 룰 이름 목록

        // aiRules 중 AWS에 실제 적용된 것 → appliedRules
        const applied = rules.filter(r => appliedRuleNames.includes(r.name));
        // 나머지 → suggestedRules
        const suggested = rules.filter(r => !appliedRuleNames.includes(r.name));

        setAppliedRules(applied);
        setSuggestedRules(suggested);

        console.log(`[WAF Sync] 적용됨: ${applied.length}개, 제안: ${suggested.length}개`);
      } else {
        // 동기화 실패 시 전부 제안으로
        setSuggestedRules(rules);
        setAppliedRules([]);
      }
    } catch (error) {
      console.error('AWS WAF 동기화 오류:', error);
      // 오류 시 전부 제안으로
      setSuggestedRules(rules);
      setAppliedRules([]);
    }
  };

  const loadRiskCalculation = async () => {
    try {
      const response = await axios.get('/api/risk-calculation');
      if (response.data.success) {
        const maxRiskValue = Math.max(response.data.max_risk, 50);
        const minRiskValue = Math.max(response.data.min_risk, 0);
        const currentRiskValue = Math.max(response.data.current_risk, 50);

        setMaxRisk(maxRiskValue);
        setMinRisk(minRiskValue);
        setCurrentRisk(currentRiskValue);

        const reductionMap = {};
        response.data.risk_reduction_per_rule.forEach(item => {
          const reduction = Math.max(item.reduction, 0);
          reductionMap[item.rule_id] = Math.round(reduction * 10) / 10;
        });
        setRiskReductionMap(reductionMap);

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

  const getCategoryColor = (category) => {
    const colorMap = attackTypeColors || {};
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
    const attackType = categoryToAttackType[category];
    const color = attackType && colorMap[attackType] ? colorMap[attackType] : '#6b7280';
    if (process.env.NODE_ENV === 'development') {
      console.log(`카테고리 "${category}" → 공격 유형 "${attackType}" → 색상 "${color}"`);
    }
    return color;
  };

  // AWS WAF 비용 계산 (WCU 기반)
  const calculateWAFCost = (wcu) => {
    // AWS WAF 가격 (ap-northeast-2 기준)
    // - 기본 Web ACL: $5.00/월
    // - WCU: $1.00 per million WCU/월
    // - 룰당 비용: $1.00/월
    
    //const baseWebACLCost = 5.00; // 월 $5
    const ruleCost = 1.00; // 룰당 월 $1
    const wcuCostPerMillion = 1.00; // 백만 WCU당 월 $1
    
    // 월간 예상 요청 수 (예: 1억 요청)
    const monthlyRequests = 100000000;
    const wcuCost = (wcu * monthlyRequests / 1000000) * wcuCostPerMillion;
    
    const totalMonthlyCost = ruleCost + wcuCost;
    
    return {
      monthly: totalMonthlyCost.toFixed(2),
      yearly: (totalMonthlyCost * 12).toFixed(2),
      wcu: wcu,
      wcuCost: wcuCost.toFixed(4)
    };
  };

  const openModal = (rule, type = 'suggested') => {
    const ruleList = type === 'suggested' ? suggestedRules : appliedRules;
    const index = ruleList.findIndex(r => r.id === rule.id);
    setSelectedRule(rule);
    setSelectedRuleIndex(index);
    setSelectedRuleType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRule(null);
    setSelectedRuleIndex(0);
  };

  const navigateRule = (direction) => {
    const ruleList = selectedRuleType === 'suggested' ? suggestedRules : appliedRules;
    const newIndex = selectedRuleIndex + direction;
    
    if (newIndex >= 0 && newIndex < ruleList.length) {
      setSelectedRule(ruleList[newIndex]);
      setSelectedRuleIndex(newIndex);
    }
  };

  const applyRule = async () => {
    if (!selectedRule) return;

    try {
      const response = await axios.post('/api/apply-rule', {
        rule_name: selectedRule.name,
        applied_at: new Date().toISOString() // 적용 시간 추가
      });

      if (response.data.success) {
        // 적용 시간 정보를 룰에 추가
        const ruleWithTimestamp = {
          ...selectedRule,
          applied_at: new Date().toISOString()
        };
        
        setSuggestedRules(prev => prev.filter(r => r.id !== selectedRule.id));
        setAppliedRules(prev => [...prev, ruleWithTimestamp]);

        const reduction = Math.max(riskReductionMap[selectedRule.id] || 0, 0);
        const newRisk = Math.max(currentRisk - reduction, minRisk);
        setCurrentRisk(Math.round(newRisk * 10) / 10);

        closeModal();
        alert(`✅ ${selectedRule.name} 룰이 적용되었습니다.\n적용 시간: ${new Date().toLocaleString('ko-KR')}\n위험도 -${reduction.toFixed(1)}점 감소`);
      }
    } catch (error) {
      console.error('룰 적용 오류:', error);
      alert('❌ 룰 적용 중 오류가 발생했습니다.');
    }
  };

  const removeRule = async (rule) => {
    const confirmed = window.confirm(`${rule.name} 룰을 제거하시겠습니까?`);
    if (!confirmed) return;

    try {
      const response = await axios.post('/api/remove-rule', {
        rule_name: rule.name
      });

      if (response.data.success) {
        setAppliedRules(prev => prev.filter(r => r.id !== rule.id));
        setSuggestedRules(prev => [...prev, rule]);

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

  const getRiskLevel = () => {
    const displayRisk = Math.min(currentRisk, 100); // 표시는 100까지만
    const isExceeded = currentRisk > 100;
    
    if (isExceeded) {
      return { level: 'EXCEEDED', color: '#7c2d12', label: '초과', displayRisk: 100 };
    }
    if (displayRisk >= 70) return { level: 'HIGH', color: '#dc2626', label: '높음', displayRisk };
    if (displayRisk >= 40) return { level: 'MEDIUM', color: '#f59e0b', label: '중간', displayRisk };
    return { level: 'LOW', color: '#10b981', label: '낮음', displayRisk };
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
                      style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}
                    >
                      {rule.category}
                    </span>
                  </div>
                  <div className="rule-stats">
                    <span><i className="fas fa-exclamation-circle"></i> {rule.total_detections || 0}건 탐지</span>
                    <span className="risk-reduction">-{Math.max(riskReductionMap[rule.id] || 0, 0).toFixed(1)}점</span>
                  </div>
                  <button className="detail-btn" onClick={() => openModal(rule, 'suggested')}>
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="rule-count">{appliedRules.length}개</span>
              <button 
                className="view-all-rules-btn"
                onClick={() => setShowAllRulesModal(true)}
                title="적용된 전체 룰 보기"
              >
                <i className="fas fa-list"></i> 전체 보기
              </button>
            </div>
          </div>
          <div className="rule-list">
            {appliedRules.length > 0 ? (
              appliedRules.map((rule) => (
                <div key={rule.id} className="rule-card applied">
                  <div className="rule-header">
                    <span className="rule-name">{rule.name}</span>
                    <button className="remove-btn" onClick={() => removeRule(rule)} title="룰 제거">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="rule-tags">
                    <span
                      className="rule-tag"
                      style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}
                    >
                      {rule.category}
                    </span>
                  </div>
                  <div className="rule-stats">
                    <span><i className="fas fa-shield-alt"></i> 활성화됨</span>
                    {rule.applied_at && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <i className="fas fa-clock"></i> {new Date(rule.applied_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <button className="detail-btn" onClick={() => openModal(rule, 'applied')}>
                    <i className="fas fa-info-circle"></i> 상세 보기
                  </button>
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

        {/* 우측: 종합 시스템 위험도 */}
        <div className="rule-column risk-gauge">
          <div className="column-header">
            <h3><i className="fas fa-tachometer-alt"></i> 종합 시스템 위험도</h3>
          </div>
          <div className="risk-display">
            <div className="risk-circle" style={{ borderColor: riskInfo.color }}>
              <div className="risk-value" style={{ color: riskInfo.color }}>
                {riskInfo.displayRisk.toFixed(1)}
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
                    width: `${((Math.min(currentRisk, maxRisk) - minRisk) / (maxRisk - minRisk)) * 100}%`,
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
              {/* 룰 이름 */}
              <div className="modal-section">
                <h4><i className="fas fa-tag"></i> 룰 이름</h4>
                <p className="rule-full-name">{selectedRule.name}</p>
              </div>

              {/* 룰 설명 */}
              <div className="modal-section">
                <h4><i className="fas fa-file-alt"></i> 룰 설명</h4>
                <ul className="description-list">
                  <li>{selectedRule.description}</li>
                  {selectedRule.improvements && selectedRule.improvements.map((improvement, index) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>

              {/* AWS 비용 정보 */}
              <div className="modal-section">
                <h4><i className="fas fa-dollar-sign"></i> AWS WAF 비용</h4>
                <ul className="cost-list">
                  <li><strong>WCU (Web ACL Capacity Units):</strong> {selectedRule.wcu} WCU</li>
                  <li><strong>월 예상 비용:</strong> ${calculateWAFCost(selectedRule.wcu).monthly} USD</li>
                  <li><strong>연 예상 비용:</strong> ${calculateWAFCost(selectedRule.wcu).yearly} USD</li>
                  <li className="cost-note">* 월 1억 요청 기준, 실제 비용은 트래픽에 따라 달라질 수 있습니다.</li>
                </ul>
              </div>

              {/* 적용 후에만 표시: 적용 정보 */}
              {selectedRuleType === 'applied' && (
                <>
                  <div className="modal-section">
                    <h4><i className="fas fa-clock"></i> 룰 적용 일시</h4>
                    <p className="applied-time">
                      {selectedRule.applied_at 
                        ? new Date(selectedRule.applied_at).toLocaleString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit' 
                          })
                        : '정보 없음'}
                    </p>
                  </div>

                  <div className="modal-section">
                    <h4><i className="fas fa-user"></i> 룰 적용 담당자</h4>
                    <p className="applied-by">
                      담당자: WAF Security Dashboard<br/>
                      적용 IP: {selectedRule.applied_ip || '자동 적용'}
                    </p>
                  </div>
                </>
              )}

              {/* 대상 (IP, 국가) */}
              <div className="modal-section">
                <h4><i className="fas fa-crosshairs"></i> 대상</h4>
                <ul className="target-list">
                  <li><strong>차단 대상 IP:</strong> {selectedRule.target_ip || '모든 IP'}</li>
                  <li><strong>차단 대상 국가:</strong> {selectedRule.target_country || '모든 국가'}</li>
                  <li><strong>적용 범위:</strong> {selectedRule.category}</li>
                </ul>
              </div>

              {/* 유형 (공격 유형) */}
              <div className="modal-section">
                <h4><i className="fas fa-exclamation-triangle"></i> 유형</h4>
                <ul className="attack-type-list">
                  <li><strong>SQL Injection:</strong> 데이터베이스 조작 시도 차단</li>
                  <li><strong>XSS (Cross-Site Scripting):</strong> 악성 스크립트 삽입 방지</li>
                  <li><strong>Command Injection:</strong> 시스템 명령어 실행 차단</li>
                  <li><strong>Path Traversal:</strong> 디렉토리 탐색 공격 방어</li>
                  <li><strong>Known Bad Inputs:</strong> 알려진 악성 입력 패턴 차단</li>
                  <li><strong>Rate Limiting:</strong> 과도한 요청 속도 제한</li>
                  <li><strong>Geo Blocking:</strong> 특정 국가 IP 차단</li>
                </ul>
              </div>

              {/* 영향도 (기대효과) */}
              <div className="modal-section">
                <h4><i className="fas fa-chart-line"></i> 영향도 (기대효과)</h4>
                <ul className="impact-list">
                  <li>불필요한 리소스 접근 차단</li>
                  <li>악의적인 IP 주소 차단</li>
                  <li>IP별 접근 속도 제한 (Rate Limiting)</li>
                  <li>오탐률 75% 감소</li>
                  <li>탐지율 95% 향상</li>
                  <li>실시간 위협 대응 능력 강화</li>
                  <li>정상 트래픽 보호 및 서비스 가용성 유지</li>
                  <li>위험도 -{Math.max(riskReductionMap[selectedRule.id] || 0, 0).toFixed(1)}점 감소</li>
                </ul>
              </div>

              {/* 관련 WAF 로그 */}
              <div className="modal-section">
                <h4><i className="fas fa-list-alt"></i> 관련 WAF 로그</h4>
                <div className="waf-logs-container">
                  {selectedRule.total_detections > 0 ? (
                    <div className="log-stats-summary">
                      <div className="log-stat">
                        <span className="log-stat-label">총 탐지:</span>
                        <span className="log-stat-value">{selectedRule.total_detections}건</span>
                      </div>
                      <div className="log-stat">
                        <span className="log-stat-label">차단:</span>
                        <span className="log-stat-value blocked">{selectedRule.blocked_count || 0}건</span>
                      </div>
                      <div className="log-stat">
                        <span className="log-stat-label">허용:</span>
                        <span className="log-stat-value allowed">{selectedRule.allowed_count || 0}건</span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-logs">관련 로그가 없습니다.</p>
                  )}
                  
                  {/* 로그 상세 내역 (스크롤 가능) */}
                  <div className="waf-logs-scroll">
                    {selectedRule.attack_summary && selectedRule.attack_summary.length > 0 ? (
                      selectedRule.attack_summary.map((log, index) => (
                        <div key={index} className="log-entry">
                          <div className="log-entry-header">
                            <span className="log-index">#{index + 1}</span>
                            <span className="log-time">{new Date().toLocaleString('ko-KR')}</span>
                          </div>
                          <div className="log-entry-content">{log}</div>
                        </div>
                      ))
                    ) : (
                      <div className="log-entry">
                        <div className="log-entry-content">
                          이 룰과 관련된 상세 로그 데이터가 수집되는 대로 표시됩니다.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-navigation">
                <button 
                  className="nav-btn" 
                  onClick={() => navigateRule(-1)}
                  disabled={selectedRuleIndex === 0}
                >
                  <i className="fas fa-chevron-left"></i> 이전
                </button>
                <span className="nav-info">
                  {selectedRuleIndex + 1} / {(selectedRuleType === 'suggested' ? suggestedRules : appliedRules).length}
                </span>
                <button 
                  className="nav-btn" 
                  onClick={() => navigateRule(1)}
                  disabled={selectedRuleIndex === (selectedRuleType === 'suggested' ? suggestedRules : appliedRules).length - 1}
                >
                  다음 <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <div className="modal-actions">
                {selectedRuleType === 'suggested' && (
                  <>
                    <button className="btn-reject" onClick={() => {
                      if (window.confirm(`${selectedRule.name} 룰을 반려하시겠습니까?`)) {
                        setSuggestedRules(prev => prev.filter(r => r.id !== selectedRule.id));
                        closeModal();
                        alert('✅ 룰이 반려되었습니다.');
                      }
                    }}>
                      <i className="fas fa-times-circle"></i> 반려
                    </button>
                    <button className="btn-approve" onClick={applyRule}>
                      <i className="fas fa-check-circle"></i> 승인
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 룰 보기 모달 */}
      {showAllRulesModal && (
        <div className="modal-overlay" onClick={() => setShowAllRulesModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-list"></i> 적용된 전체 WAF 룰</h3>
              <button className="modal-close" onClick={() => setShowAllRulesModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="all-rules-list">
                {appliedRules.length > 0 ? (
                  appliedRules.map((rule, index) => (
                    <div key={rule.id} className="all-rules-item">
                      <div className="rule-number">{index + 1}</div>
                      <div className="rule-details">
                        <div className="rule-name-row">
                          <span className="rule-name">{rule.name}</span>
                          <span className="rule-wcu">{rule.wcu} WCU</span>
                        </div>
                        <div className="rule-meta">
                          <span
                            className="rule-tag"
                            style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}
                          >
                            {rule.category}
                          </span>
                          <span className="rule-description">{rule.description}</span>
                        </div>
                        <div className="rule-stats-row">
                          <span><i className="fas fa-shield-alt"></i> 활성화됨</span>
                          <span><i className="fas fa-exclamation-circle"></i> {rule.total_detections || 0}건 탐지</span>
                        </div>
                      </div>
                      <button 
                        className="remove-btn-small" 
                        onClick={() => {
                          setShowAllRulesModal(false);
                          removeRule(rule);
                        }}
                        title="룰 제거"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="fas fa-info-circle"></i>
                    <p>적용된 룰이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAllRulesModal(false)}>
                <i className="fas fa-times"></i> 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RuleManagement;