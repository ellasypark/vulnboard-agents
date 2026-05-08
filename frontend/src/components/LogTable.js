import React, { useState, useMemo, useRef } from 'react';
import './LogTable.css';

function LogTable({ logs }) {
  // 정렬 상태
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // 필터 상태
  const [filters, setFilters] = useState({
    source_ip: '',
    dest_ip: '',
    attack_type: '',
    waf_action: ''
  });
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // 필터 표시 여부
  const [showFilters, setShowFilters] = useState(false);
  
  // 테이블 참조 (스크롤용)
  const tableRef = useRef(null);

  // 정렬 함수
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // 정렬 시 첫 페이지로
  };

  // 필터 변경 함수
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      source_ip: '',
      dest_ip: '',
      attack_type: '',
      waf_action: ''
    });
    setCurrentPage(1);
  };

  // 정렬 및 필터링된 로그 데이터
  const processedLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    let filtered = [...logs];

    // 필터 적용
    if (filters.source_ip) {
      filtered = filtered.filter(log => 
        log.source_ip?.toLowerCase().includes(filters.source_ip.toLowerCase())
      );
    }
    if (filters.dest_ip) {
      filtered = filtered.filter(log => 
        log.dest_ip?.toLowerCase().includes(filters.dest_ip.toLowerCase())
      );
    }
    if (filters.attack_type) {
      filtered = filtered.filter(log => 
        log.attack_type?.toLowerCase().includes(filters.attack_type.toLowerCase())
      );
    }
    if (filters.waf_action) {
      filtered = filtered.filter(log => 
        log.waf_action?.toLowerCase().includes(filters.waf_action.toLowerCase())
      );
    }

    // 정렬 적용
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // 날짜 정렬
        if (sortConfig.key === 'timestamp') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // 문자열 정렬
        if (typeof aValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        // 숫자 정렬
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [logs, sortConfig, filters]);

  // 페이지네이션 계산 (필터링된 결과 기준)
  const totalPages = Math.ceil(processedLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = processedLogs.slice(startIndex, endIndex);

  // 페이지 변경
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // 테이블 상단으로 부드럽게 스크롤 (약간의 여유 공간 포함)
      if (tableRef.current) {
        const tableTop = tableRef.current.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ 
          top: tableTop - 100, // 테이블 위 100px 여유 공간
          behavior: 'smooth' 
        });
      }
    }
  };

  // 페이지 번호 생성 (최대 10개 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 10;
    
    if (totalPages <= maxVisible) {
      // 전체 페이지가 10개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 기준으로 앞뒤 페이지 표시
      let start = Math.max(1, currentPage - 4);
      let end = Math.min(totalPages, currentPage + 5);
      
      // 시작이 1이면 끝을 늘림
      if (start === 1) {
        end = Math.min(totalPages, maxVisible);
      }
      // 끝이 마지막이면 시작을 줄임
      if (end === totalPages) {
        start = Math.max(1, totalPages - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // 정렬 아이콘 렌더링
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <i className="fas fa-sort sort-icon"></i>;
    }
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up sort-icon active"></i>
      : <i className="fas fa-sort-down sort-icon active"></i>;
  };

  // 활성 필터 개수
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="card" ref={tableRef}>
      <div className="card-title-row">
        <div className="card-title">
          <i className="fas fa-list"></i> WAF 로그
          {processedLogs.length !== logs?.length && (
            <span className="filter-count">
              ({processedLogs.length} / {logs?.length || 0})
            </span>
          )}
        </div>
        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fas fa-filter"></i> 필터
          {activeFilterCount > 0 && (
            <span className="badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-item">
              <label>소스 IP</label>
              <input
                type="text"
                placeholder="IP 주소 검색..."
                value={filters.source_ip}
                onChange={(e) => handleFilterChange('source_ip', e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>목적 IP</label>
              <input
                type="text"
                placeholder="IP 주소 검색..."
                value={filters.dest_ip}
                onChange={(e) => handleFilterChange('dest_ip', e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>공격 유형</label>
              <input
                type="text"
                placeholder="공격 유형 검색..."
                value={filters.attack_type}
                onChange={(e) => handleFilterChange('attack_type', e.target.value)}
              />
            </div>
            <div className="filter-item">
              <label>WAF 조치</label>
              <select
                value={filters.waf_action}
                onChange={(e) => handleFilterChange('waf_action', e.target.value)}
              >
                <option value="">전체</option>
                <option value="BLOCK">BLOCK</option>
                <option value="ALLOW">ALLOW</option>
                <option value="COUNT">COUNT</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="clear-btn" onClick={clearFilters}>
              <i className="fas fa-times"></i> 필터 초기화
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('timestamp')}>
                발생일시 {renderSortIcon('timestamp')}
              </th>
              <th onClick={() => handleSort('source_ip')}>
                소스 IP {renderSortIcon('source_ip')}
              </th>
              <th onClick={() => handleSort('dest_ip')}>
                목적 IP {renderSortIcon('dest_ip')}
              </th>
              <th onClick={() => handleSort('http_request')}>
                HTTP 요청 {renderSortIcon('http_request')}
              </th>
              <th>요청 파라미터</th>
              <th onClick={() => handleSort('http_response')}>
                HTTP 응답 {renderSortIcon('http_response')}
              </th>
              <th onClick={() => handleSort('attack_type')}>
                공격 유형 {renderSortIcon('attack_type')}
              </th>
              <th onClick={() => handleSort('waf_action')}>
                WAF 조치 {renderSortIcon('waf_action')}
              </th>
            </tr>
          </thead>
          <tbody>
            {currentLogs && currentLogs.length > 0 ? (
              currentLogs.map((log, index) => (
                <tr key={index}>
                  <td><div>{new Date(log.timestamp).toLocaleString('ko-KR')}</div></td>
                  <td><div>{log.source_ip}</div></td>
                  <td><div>{log.dest_ip}</div></td>
                  <td><div>{log.http_request}</div></td>
                  <td><div>{log.args || 'N/A'}</div></td>
                  <td><div>{log.http_response}</div></td>
                  <td><div>{log.attack_type}</div></td>
                  <td>
                    <div>
                      <span className={`risk-badge risk-${
                        log.waf_action === 'BLOCK' ? 'high' : 
                        log.waf_action === 'COUNT' ? 'medium' : 'low'
                      }`}>
                        {log.waf_action}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    {logs && logs.length > 0 ? '필터 조건에 맞는 로그가 없습니다.' : '로딩 중...'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 - 필터링된 결과가 20개 이상일 때 표시 */}
      {processedLogs.length > itemsPerPage && (
        <div className="pagination">
          <div className="pagination-info">
            {processedLogs.length > 0 ? (
              <>
                {startIndex + 1}-{Math.min(endIndex, processedLogs.length)} / {processedLogs.length}개
                {logs && logs.length !== processedLogs.length && (
                  <span style={{ marginLeft: '0.5rem', color: '#4a90e2' }}>
                    (전체 {logs.length}개 중 필터링됨)
                  </span>
                )}
              </>
            ) : (
              '0개'
            )}
          </div>
          <div className="pagination-controls">
            {/* 맨 처음 */}
            <button 
              className="page-btn"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              title="첫 페이지"
            >
              <i className="fas fa-angle-double-left"></i>
            </button>
            
            {/* 이전 */}
            <button 
              className="page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              title="이전 페이지"
            >
              <i className="fas fa-angle-left"></i>
            </button>
            
            {/* 페이지 번호 */}
            {getPageNumbers().map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            
            {/* 다음 */}
            <button 
              className="page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="다음 페이지"
            >
              <i className="fas fa-angle-right"></i>
            </button>
            
            {/* 맨 끝 */}
            <button 
              className="page-btn"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              title="마지막 페이지"
            >
              <i className="fas fa-angle-double-right"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogTable;
