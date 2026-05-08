import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RuleComparison.css';

function RuleComparison({ selectedType, rulesBefore, rulesAfter, attackTypeColors }) {
  const [selectedRules, setSelectedRules] = useState([]);
  const [isApplying, setIsApplying] = useState(false);

  // 선택된 타입이 변경되면 체크박스 초기화
  useEffect(() => {
    setSelectedRules([]);
  }, [selectedType]);

  // 체크박스 토글
  const toggleRule = (ruleId) => {
    setSelectedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  // 전체 선택/해제
  const toggleAll = () => {
    const rules = selectedType === 'before' ? rulesBefore : rulesAfter;
    if (selectedRules.length === rules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(rules.map(r => r.id));
    }
  };

  // 룰 적용
  const applyRules = async () => {
    if (selectedRules.length === 0) {
      alert('적용할 룰을 선택해주세요.');
      return;
    }

    const confirmed = window.confirm(
      `선택한 ${selectedRules.length}개의 룰을 WAF에 적용하시겠습니까?\n\n이 작업은 실제 WAF 설정을 변경합니다.`
    );

    if (!confirmed) return;

    setIsApplying(true);
    try {
      const response = await axios.post('/api/apply-rules', {
        type: selectedType,
        selected_rules: selectedRules
      });

      if (response.data.success) {
        alert(`✅ ${response.data.message}`);
        setSelectedRules([]);
      } else {
        alert(`❌ 오류: ${response.data.error}`);
      }
    } catch (error) {
      console.error('룰 적용 오류:', error);
      alert('❌ 룰 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  // 카테고리에서 색상 가져오기
  const getCategoryColor = (category) => {
    const colorMap = attackTypeColors || {};
    
    // 카테고리 키워드 매핑
    const keywordMap = {
      'IP Reputation': colorMap['IP Reputation'] || '#3b82f6',
      'Common Vulnerabilities': colorMap['Common Vulnerabilities'] || '#ec4899',
      'Known Bad Inputs': colorMap['Known Bad Inputs'] || '#14b8a6',
      'SQL Injection': colorMap['SQL Injection'] || '#ef4444',
      'Linux Protection': colorMap['Linux Protection'] || '#84cc16',
      'Unix Protection': colorMap['Unix Protection'] || '#a3e635',
      'Rate Limiting': colorMap['Rate Limiting'] || '#f43f5e',
      'Geo Blocking': colorMap['Geo Blocking'] || '#8b5cf6'
    };

    return keywordMap[category] || '#6b7280';
  };

  const rules = selectedType === 'before' ? rulesBefore : rulesAfter;
  const allSelected = rules && selectedRules.length === rules.length && rules.length > 0;

  if (!selectedType) {
    return (
      <div className="compare-section">
        <h3>WAF 룰 적용</h3>
        <p className="no-selection">
          <i className="fas fa-info-circle"></i> 개선 전 또는 개선 후 룰을 먼저 선택해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="compare-section">
      <div className="compare-header">
        <h3>
          {selectedType === 'before' ? (
            <><i className="fas fa-exclamation-triangle"></i> 개선 전 룰 적용</>
          ) : (
            <><i className="fas fa-check-circle"></i> 개선 후 룰 적용 (권장)</>
          )}
        </h3>
        <div className="select-all-container">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
            />
            <span>전체 선택</span>
          </label>
        </div>
      </div>

      <div className="rules-list">
        {rules && rules.length > 0 ? (
          rules.map((rule) => (
            <div key={rule.id} className="rule-item-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedRules.includes(rule.id)}
                  onChange={() => toggleRule(rule.id)}
                />
                <div className="rule-info">
                  <div className="rule-name-row">
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
                    <span className="rule-detections">
                      {rule.total_detections || 0}건 탐지
                    </span>
                  </div>
                </div>
              </label>
            </div>
          ))
        ) : (
          <p className="no-rules">표시할 룰이 없습니다.</p>
        )}
      </div>

      <div className="apply-actions">
        <div className="selected-count">
          선택됨: <strong>{selectedRules.length}</strong> / {rules?.length || 0}
        </div>
        <button 
          className="apply-btn" 
          onClick={applyRules}
          disabled={selectedRules.length === 0 || isApplying}
        >
          {isApplying ? (
            <><i className="fas fa-spinner fa-spin"></i> 적용 중...</>
          ) : (
            <><i className="fas fa-shield-alt"></i> 선택한 룰 적용하기</>
          )}
        </button>
      </div>
    </div>
  );
}

export default RuleComparison;
