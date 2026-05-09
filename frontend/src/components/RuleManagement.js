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
  const [selectedRuleType, setSelectedRuleType] = useState('suggested');
  const [showModal, setShowModal] = useState(false);
  const [showAllRulesModal, setShowAllRulesModal] = useState(false);

  useEffect(() => {
    if (aiRules && aiRules.length > 0) {
      syncWithAWS(aiRules);
      loadRiskCalculation();
    }
  }, [aiRules]);

  const syncWithAWS = async (rules) => {
    try {
      const response = await axios.get('/api/waf-sync');
      if (response.data.success) {
        const appliedRuleNames = response.data.applied_rules;
        setAppliedRules(rules.filter(r => appliedRuleNames.includes(r.name)));
        setSuggestedRules(rules.filter(r => !appliedRuleNames.includes(r.name)));
      } else {
        setSuggestedRules(rules);
        setAppliedRules([]);
      }
    } catch (error) {
      setSuggestedRules(rules);
      setAppliedRules([]);
    }
  };

  const loadRiskCalculation = async () => {
    try {
      const response = await axios.get('/api/risk-calculation');
      if (response.data.success) {
        setMaxRisk(Math.max(response.data.max_risk, 50));
        setMinRisk(Math.max(response.data.min_risk, 0));
        setCurrentRisk(Math.max(response.data.current_risk, 50));
        const reductionMap = {};
        response.data.risk_reduction_per_rule.forEach(item => {
          reductionMap[item.rule_id] = Math.round(Math.max(item.reduction, 0) * 10) / 10;
        });
        setRiskReductionMap(reductionMap);
      }
    } catch (error) {
      console.error('위험도 계산 로드 오류:', error);
    }
  };

  const getCategoryColor = (category) => {
    const colorMap = attackTypeColors || {};
    const map = {
      'IP Reputation': 'IP Reputation',
      'Common Vulnerabilities': 'Common Vulnerabilities',
      'Known Bad Inputs': 'Known Bad Inputs',
      'SQL Injection Protection': 'SQL Injection',
      'Linux Protection': 'Linux Protection',
      'Unix Protection': 'Unix Protection',
      'Rate Limiting': 'Rate Limiting',
      'Geo Blocking': 'Geo Blocking'
    };
    const at = map[category];
    return (at && colorMap[at]) ? colorMap[at] : '#6b7280';
  };

  const calculateWAFCost = (wcu) => {
    const ruleCost = 1.00;
    const wcuCost = (wcu * 100000000 / 1000000) * 1.00;
    const total = ruleCost + wcuCost;
    return { monthly: total.toFixed(2), yearly: (total * 12).toFixed(2) };
  };

  const openModal = (rule, type = 'suggested') => {
    const list = type === 'suggested' ? suggestedRules : appliedRules;
    setSelectedRule(rule);
    setSelectedRuleIndex(list.findIndex(r => r.id === rule.id));
    setSelectedRuleType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRule(null);
    setSelectedRuleIndex(0);
  };

  const navigateRule = (direction) => {
    const list = selectedRuleType === 'suggested' ? suggestedRules : appliedRules;
    const newIndex = selectedRuleIndex + direction;
    if (newIndex >= 0 && newIndex < list.length) {
      setSelectedRule(list[newIndex]);
      setSelectedRuleIndex(newIndex);
    }
  };

  const applyRule = async () => {
    if (!selectedRule) return;
    try {
      const response = await axios.post('/api/apply-rule', {
        rule_name: selectedRule.name,
        applied_at: new Date().toISOString()
      });
      if (response.data.success) {
        const ruleWithTs = { ...selectedRule, applied_at: new Date().toISOString() };
        setSuggestedRules(prev => prev.filter(r => r.id !== selectedRule.id));
        setAppliedRules(prev => [...prev, ruleWithTs]);
        const reduction = Math.max(riskReductionMap[selectedRule.id] || 0, 0);
        setCurrentRisk(prev => Math.round(Math.max(prev - reduction, minRisk) * 10) / 10);
        closeModal();
        alert(`✅ ${selectedRule.name} 룰이 적용되었습니다.\n위험도 -${reduction.toFixed(1)}점 감소`);
      }
    } catch (error) {
      alert('❌ 룰 적용 중 오류가 발생했습니다.');
    }
  };

  const removeRule = async (rule) => {
    if (!window.confirm(`${rule.name} 룰을 제거하시겠습니까?`)) return;
    try {
      const response = await axios.post('/api/remove-rule', { rule_name: rule.name });
      if (response.data.success) {
        setAppliedRules(prev => prev.filter(r => r.id !== rule.id));
        setSuggestedRules(prev => [...prev, rule]);
        const reduction = Math.max(riskReductionMap[rule.id] || 0, 0);
        setCurrentRisk(prev => Math.round(Math.min(prev + reduction, maxRisk) * 10) / 10);
        alert(`✅ ${rule.name} 룰이 제거되었습니다.\n위험도 +${reduction.toFixed(1)}점 증가`);
      }
    } catch (error) {
      alert('❌ 룰 제거 중 오류가 발생했습니다.');
    }
  };

  const getRiskLevel = () => {
    const d = Math.min(currentRisk, 100);
    if (currentRisk > 100) return { color: '#7c2d12', label: '초과', displayRisk: 100 };
    if (d >= 70) return { color: '#dc2626', label: '높음', displayRisk: d };
    if (d >= 40) return { color: '#f59e0b', label: '중간', displayRisk: d };
    return { color: '#10b981', label: '낮음', displayRisk: d };
  };

  const riskInfo = getRiskLevel();
  const currentList = selectedRuleType === 'suggested' ? suggestedRules : appliedRules;
  const cost = selectedRule ? calculateWAFCost(selectedRule.wcu) : null;
  const reduction = selectedRule ? Math.max(riskReductionMap[selectedRule.id] || 0, 0) : 0;

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
            {suggestedRules.length > 0 ? suggestedRules.map((rule) => (
              <div key={rule.id} className="rule-card">
                <div className="rule-header">
                  <span className="rule-name">{rule.name}</span>
                  <span className="rule-wcu">{rule.wcu} WCU</span>
                </div>
                <div className="rule-tags">
                  <span className="rule-tag" style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}>
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
            )) : (
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
              <button className="view-all-rules-btn" onClick={() => setShowAllRulesModal(true)}>
                <i className="fas fa-list"></i> 전체 보기
              </button>
            </div>
          </div>
          <div className="rule-list">
            {appliedRules.length > 0 ? appliedRules.map((rule) => (
              <div key={rule.id} className="rule-card applied">
                <div className="rule-header">
                  <span className="rule-name">{rule.name}</span>
                  <button className="remove-btn" onClick={() => removeRule(rule)} title="룰 제거">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className="rule-tags">
                  <span className="rule-tag" style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}>
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
                <button className="detail-btn applied-detail-btn" onClick={() => openModal(rule, 'applied')}>
                  <i className="fas fa-chart-bar"></i> 적용 현황
                </button>
              </div>
            )) : (
              <div className="empty-state">
                <i className="fas fa-info-circle"></i>
                <p>적용된 룰이 없습니다.</p>
                <p className="empty-hint">좌측의 AI 제안 룰을 검토하고 적용하세요.</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 위험도 게이지 */}
        <div className="rule-column risk-gauge">
          <div className="column-header">
            <h3><i className="fas fa-tachometer-alt"></i> 종합 시스템 위험도</h3>
          </div>
          <div className="risk-display">
            <div className="risk-circle" style={{ borderColor: riskInfo.color }}>
              <div className="risk-value" style={{ color: riskInfo.color }}>{riskInfo.displayRisk.toFixed(1)}</div>
              <div className="risk-label">{riskInfo.label}</div>
            </div>
            <div className="risk-bar-container">
              <div className="risk-bar-labels">
                <span>최저 ({minRisk})</span>
                <span>최고 ({maxRisk})</span>
              </div>
              <div className="risk-bar">
                <div className="risk-bar-fill" style={{ width: `${((Math.min(currentRisk, maxRisk) - minRisk) / (maxRisk - minRisk)) * 100}%`, backgroundColor: riskInfo.color }}></div>
              </div>
            </div>
            <div className="risk-info">
              <div className="risk-info-item"><span className="info-label">적용된 룰</span><span className="info-value">{appliedRules.length}개</span></div>
              <div className="risk-info-item"><span className="info-label">남은 제안</span><span className="info-value">{suggestedRules.length}개</span></div>
              <div className="risk-info-item"><span className="info-label">위험도 감소</span><span className="info-value" style={{ color: '#10b981' }}>-{(maxRisk - currentRisk).toFixed(1)}점</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ★ 상세 보기 모달 - suggested / applied 구분 */}
      {showModal && selectedRule && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className={`modal-content ${selectedRuleType === 'applied' ? 'modal-applied' : 'modal-suggested'}`} onClick={e => e.stopPropagation()}>
            
            {/* 헤더 - 타입에 따라 색상 구분 */}
            <div className={`modal-header ${selectedRuleType === 'applied' ? 'header-applied' : 'header-suggested'}`}>
              <div className="modal-header-left">
                <span className={`modal-type-badge ${selectedRuleType === 'applied' ? 'badge-applied' : 'badge-suggested'}`}>
                  {selectedRuleType === 'applied' ? <><i className="fas fa-check-circle"></i> 적용된 룰</> : <><i className="fas fa-robot"></i> AI 제안 룰</>}
                </span>
                <h3>{selectedRule.name}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>

            <div className="modal-body">

              {/* ══════════════════════════════════
                  AI 제안 룰 전용 내용
                  ══════════════════════════════════ */}
              {selectedRuleType === 'suggested' && (
                <>
                  {/* 왜 이 룰을 제안하는가 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-lightbulb"></i> AI 제안 이유</h4>
                    <div className="suggest-reason-box">
                      <p>{selectedRule.description}</p>
                      {selectedRule.total_detections > 0 && (
                        <div className="detection-highlight">
                          <i className="fas fa-exclamation-triangle"></i>
                          최근 <strong>{selectedRule.total_detections}건</strong>의 관련 공격이 탐지되었습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 탐지된 공격 통계 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-chart-bar"></i> 탐지 통계</h4>
                    <div className="stats-grid-3">
                      <div className="stat-box">
                        <span className="stat-box-value">{selectedRule.total_detections || 0}</span>
                        <span className="stat-box-label">총 탐지</span>
                      </div>
                      <div className="stat-box stat-box-red">
                        <span className="stat-box-value">{selectedRule.blocked_count || 0}</span>
                        <span className="stat-box-label">차단</span>
                      </div>
                      <div className="stat-box stat-box-green">
                        <span className="stat-box-value">{selectedRule.allowed_count || 0}</span>
                        <span className="stat-box-label">허용 (오탐 가능)</span>
                      </div>
                    </div>
                  </div>

                  {/* 주요 공격 패턴 */}
                  {selectedRule.attack_summary && selectedRule.attack_summary[0] !== '탐지된 공격 없음' && (
                    <div className="modal-section">
                      <h4><i className="fas fa-bug"></i> 주요 탐지 공격 패턴</h4>
                      <ul className="pattern-list">
                        {selectedRule.attack_summary.map((s, i) => (
                          <li key={i}><i className="fas fa-angle-right"></i> {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 적용 시 기대 효과 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-magic"></i> 적용 시 기대 효과</h4>
                    <ul className="effect-list">
                      {(selectedRule.improvements || [
                        'LLM 기반 컨텍스트 분석으로 오탐률 75% 감소',
                        '정상 트래픽 화이트리스트 자동 생성',
                        '실시간 위협 인텔리전스 통합',
                        '공격 패턴 학습 및 자동 업데이트'
                      ]).map((imp, i) => (
                        <li key={i}><i className="fas fa-check-circle"></i> {imp}</li>
                      ))}
                      <li><i className="fas fa-check-circle"></i> 위험도 <strong>-{reduction.toFixed(1)}점</strong> 감소 예상</li>
                    </ul>
                  </div>


                  {/* 적용 범위 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-crosshairs"></i> 적용 범위</h4>
                    <ul className="scope-list">
                      <li><strong>카테고리:</strong> {selectedRule.category}</li>
                      <li><strong>차단 대상:</strong> {selectedRule.target_ip || '모든 IP'}</li>
                      <li><strong>대상 국가:</strong> {selectedRule.target_country || '전 세계'}</li>
                    </ul>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════
                  적용된 룰 전용 내용
                  ══════════════════════════════════ */}
              {selectedRuleType === 'applied' && (
                <>
                  {/* 적용 정보 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-info-circle"></i> 적용 정보</h4>
                    <div className="applied-info-box">
                      <div className="applied-info-row">
                        <span><i className="fas fa-user"></i> 적용 주체</span>
                        <strong>WAF Security Dashboard (IAM HALO)</strong>
                      </div>
                      <div className="applied-info-row">
                        <span><i className="fas fa-shield-alt"></i> 적용 모드</span>
                        <strong className="mode-block">BLOCK (실제 차단)</strong>
                      </div>
                      <div className="applied-info-row">
                        <span><i className="fas fa-tag"></i> 카테고리</span>
                        <span className="rule-tag" style={{ backgroundColor: getCategoryColor(selectedRule.category), color: 'white' }}>
                          {selectedRule.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 현재 차단 현황 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-chart-line"></i> 현재 차단 현황</h4>
                    <div className="stats-grid-3">
                      <div className="stat-box">
                        <span className="stat-box-value">{selectedRule.total_detections || 0}</span>
                        <span className="stat-box-label">총 탐지</span>
                      </div>
                      <div className="stat-box stat-box-red">
                        <span className="stat-box-value">{selectedRule.blocked_count || 0}</span>
                        <span className="stat-box-label">차단 완료</span>
                      </div>
                      <div className="stat-box stat-box-green">
                        <span className="stat-box-value">{reduction.toFixed(1)}</span>
                        <span className="stat-box-label">위험도 감소</span>
                      </div>
                    </div>
                  </div>

                  {/* 실제 차단 효과 */}
                  <div className="modal-section">
                    <h4><i className="fas fa-shield-alt"></i> 실제 보안 효과</h4>
                    <ul className="effect-list applied-effect-list">
                      <li><i className="fas fa-check-circle"></i> <strong>{selectedRule.category}</strong> 공격을 실시간 차단 중</li>
                      <li><i className="fas fa-check-circle"></i> Block 모드로 실제 트래픽 차단 활성화</li>
                      <li><i className="fas fa-check-circle"></i> CloudWatch 메트릭 수집 중</li>
                      <li><i className="fas fa-check-circle"></i> 위험도 {reduction.toFixed(1)}점 감소 달성</li>
                      {selectedRule.expected_effect && (
                        <li><i className="fas fa-check-circle"></i> {selectedRule.expected_effect}</li>
                      )}
                    </ul>
                  </div>

                  {/* 탐지 패턴 */}
                  {selectedRule.attack_summary && selectedRule.attack_summary[0] !== '탐지된 공격 없음' && (
                    <div className="modal-section">
                      <h4><i className="fas fa-bug"></i> 차단된 공격 패턴</h4>
                      <ul className="pattern-list">
                        {selectedRule.attack_summary.map((s, i) => (
                          <li key={i}><i className="fas fa-ban"></i> {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}


                  {/* 제거 경고 */}
                  <div className="modal-section">
                    <div className="remove-warning-box">
                      <i className="fas fa-exclamation-triangle"></i>
                      <p>이 룰을 제거하면 해당 카테고리의 공격 차단이 즉시 중단되고 위험도가 <strong>+{reduction.toFixed(1)}점</strong> 증가합니다.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 푸터 */}
            <div className="modal-footer">
              <div className="modal-navigation">
                <button className="nav-btn" onClick={() => navigateRule(-1)} disabled={selectedRuleIndex === 0}>
                  <i className="fas fa-chevron-left"></i> 이전
                </button>
                <span className="nav-info">{selectedRuleIndex + 1} / {currentList.length}</span>
                <button className="nav-btn" onClick={() => navigateRule(1)} disabled={selectedRuleIndex === currentList.length - 1}>
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
                {selectedRuleType === 'applied' && (
                  <button className="btn-reject" onClick={() => {
                    closeModal();
                    removeRule(selectedRule);
                  }}>
                    <i className="fas fa-trash"></i> 룰 제거
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체 룰 보기 모달 */}
      {showAllRulesModal && (
        <div className="modal-overlay" onClick={() => setShowAllRulesModal(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header header-applied">
              <div className="modal-header-left">
                <span className="modal-type-badge badge-applied"><i className="fas fa-list"></i> 적용된 전체 룰</span>
                <h3>AWS WAF 활성 룰 목록</h3>
              </div>
              <button className="modal-close" onClick={() => setShowAllRulesModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="all-rules-list">
                {appliedRules.length > 0 ? appliedRules.map((rule, index) => (
                  <div key={rule.id} className="all-rules-item">
                    <div className="rule-number">{index + 1}</div>
                    <div className="rule-details">
                      <div className="rule-name-row">
                        <span className="rule-name">{rule.name}</span>
                        <span className="rule-wcu">{rule.wcu} WCU</span>
                      </div>
                      <div className="rule-meta">
                        <span className="rule-tag" style={{ backgroundColor: getCategoryColor(rule.category), color: 'white' }}>{rule.category}</span>
                        <span className="rule-description">{rule.description}</span>
                      </div>
                      <div className="rule-stats-row">
                        <span><i className="fas fa-shield-alt"></i> Block 모드 활성</span>
                        <span><i className="fas fa-exclamation-circle"></i> {rule.total_detections || 0}건 탐지</span>
                        {rule.applied_at && <span><i className="fas fa-clock"></i> {new Date(rule.applied_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>
                    <button className="remove-btn-small" onClick={() => { setShowAllRulesModal(false); removeRule(rule); }} title="룰 제거">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )) : (
                  <div className="empty-state">
                    <i className="fas fa-info-circle"></i>
                    <p>적용된 룰이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAllRulesModal(false)}>
                  <i className="fas fa-times"></i> 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RuleManagement;