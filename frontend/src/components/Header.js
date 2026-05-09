import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import './Header.css';

function Header({ onDownloadReport, isDarkMode }) {
  const { toggleTheme } = useTheme();

  const handleDownload = () => {
    // API 서버로 직접 요청
    window.open('http://localhost:5000/api/download-report', '_blank');
  };

  return (
    <header className="header">
      <h1>
        <i className="fas fa-shield-alt"></i> WAF 보안 대시보드
      </h1>
      <div className="header-controls">
        <button className="theme-toggle" onClick={toggleTheme}>
          <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i> 테마 변경
        </button>
        <button className="download-btn" onClick={handleDownload}>
          <i className="fas fa-download"></i> 보고서 다운로드
        </button>
      </div>
    </header>
  );
}

export default Header;
