import React from 'react';
import './DashboardGrid.css';

const DashboardGrid = ({ children }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        {children}
      </div>
    </div>
  );
};

export const GridPanel = ({ 
  title, 
  subtitle, 
  actions, 
  children, 
  className = '',
  size = 'medium' // small, medium, large, full
}) => {
  return (
    <div className={`grid-panel panel ${size} ${className}`}>
      {(title || actions) && (
        <div className="panel-header">
          <div className="panel-header-left">
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <span className="panel-subtitle">{subtitle}</span>}
          </div>
          {actions && (
            <div className="panel-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardGrid;
