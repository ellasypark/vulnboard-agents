import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import './TopBar.css';

const TopBar = ({ onDownloadReport, onRefresh }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [dateRange, setDateRange] = useState('Last 15 minutes');

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="logo-section">
          <i className="fas fa-shield-alt logo-icon"></i>
          <span className="logo-text">WAF Security</span>
        </div>
        <div className="breadcrumbs">
          <span className="breadcrumb-item">Home</span>
          <i className="fas fa-chevron-right breadcrumb-separator"></i>
          <span className="breadcrumb-item">Dashboards</span>
          <i className="fas fa-chevron-right breadcrumb-separator"></i>
          <span className="breadcrumb-item active">Security Monitor</span>
        </div>
      </div>

      <div className="topbar-center">
        <div className="search-bar">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text" 
            placeholder="Search logs, IPs, attack types..." 
            className="search-input"
          />
          <button className="kql-button">
            <i className="fas fa-code"></i>
            KQL
          </button>
        </div>
      </div>

      <div className="topbar-right">
        <div className="date-picker">
          <i className="fas fa-calendar-alt"></i>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-select"
          >
            <option>Last 5 minutes</option>
            <option>Last 15 minutes</option>
            <option>Last 30 minutes</option>
            <option>Last 1 hour</option>
            <option>Last 3 hours</option>
            <option>Last 6 hours</option>
            <option>Last 12 hours</option>
            <option>Last 24 hours</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>

        <button className="btn-icon" onClick={onRefresh} title="Refresh">
          <i className="fas fa-sync-alt"></i>
        </button>

        <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
          <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
        </button>

        <button className="btn-icon" onClick={onDownloadReport} title="Download Report">
          <i className="fas fa-download"></i>
        </button>

        <div className="user-menu">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
