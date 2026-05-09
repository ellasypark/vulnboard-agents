import React from 'react';
import './StatCard.css';

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', // positive, negative, neutral
  icon,
  trend,
  subtitle
}) => {
  return (
    <div className="stat-card-container panel">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {icon && (
          <div className="stat-card-icon">
            <i className={`fas fa-${icon}`}></i>
          </div>
        )}
      </div>
      
      <div className="stat-card-body">
        <div className="stat-card-value">{value}</div>
        
        {change !== undefined && (
          <div className={`stat-card-change ${changeType}`}>
            <i className={`fas fa-${changeType === 'positive' ? 'arrow-up' : changeType === 'negative' ? 'arrow-down' : 'minus'}`}></i>
            <span>{change}</span>
          </div>
        )}
        
        {subtitle && (
          <div className="stat-card-subtitle">{subtitle}</div>
        )}
      </div>
      
      {trend && (
        <div className="stat-card-trend">
          {trend}
        </div>
      )}
    </div>
  );
};

export default StatCard;
