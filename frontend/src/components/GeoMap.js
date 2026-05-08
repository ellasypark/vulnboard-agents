import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './GeoMap.css';

function GeoMap({ data, isDarkMode }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 데이터 구조 확인
    const geoData = data?.data || data || {};
    const legend = data?.legend || {};
    const thresholds = legend.thresholds || {};

    // 지도 초기화
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 6,
      });
    }

    // 타일 레이어 업데이트
    const tileUrl = isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    
    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    // 마커 추가
    const countryCoordinates = {
      'KR': [37.5665, 126.9780],
      'US': [37.0902, -95.7129],
      'CN': [35.8617, 104.1954],
      'JP': [36.2048, 138.2529],
      'RU': [61.5240, 105.3188],
      'DE': [51.1657, 10.4515],
      'FR': [46.2276, 2.2137],
      'GB': [55.3781, -3.4360],
      'BR': [-14.2350, -51.9253],
      'IN': [20.5937, 78.9629],
      'NL': [52.1326, 5.2913],
    };

    const countryNames = {
      'KR': '대한민국', 'US': '미국', 'CN': '중국', 'JP': '일본',
      'RU': '러시아', 'DE': '독일', 'FR': '프랑스', 'GB': '영국',
      'BR': '브라질', 'IN': '인도', 'NL': '네덜란드',
    };

    // 상대적 기준으로 색상 및 크기 결정 (빨간색 계열)
    const highThreshold = thresholds.high || 10;
    const mediumThreshold = thresholds.medium || 5;

    Object.entries(geoData).forEach(([country, count]) => {
      const coords = countryCoordinates[country];
      if (!coords) return;

      let color, radius, level;
      if (count >= highThreshold) {
        color = '#dc2626';  // 높음 - 진한 빨강
        radius = 15;
        level = '높음';
      } else if (count >= mediumThreshold) {
        color = '#f87171';  // 중간 - 중간 빨강
        radius = 12;
        level = '중간';
      } else {
        color = '#fca5a5';  // 낮음 - 연한 빨강
        radius = 8;
        level = '낮음';
      }

      const circle = L.circleMarker(coords, {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(mapInstanceRef.current);

      const countryName = countryNames[country] || country;
      circle.bindPopup(`
        <div style="text-align: center; padding: 5px;">
          <strong>${countryName}</strong><br>
          공격 횟수: <span style="color: ${color}; font-weight: bold;">${count}</span><br>
          <span style="font-size: 0.85em; color: #666;">빈도: ${level}</span>
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data, isDarkMode]);

  // 범례 데이터
  const legend = data?.legend || {};
  const ranges = legend.ranges || [];
  const colors = legend.colors || [];

  return (
    <div className="card">
      <div className="card-title">
        <i className="fas fa-globe"></i> 지역별 트래픽
      </div>
      <div className="map-container">
        <div ref={mapRef} id="geoMap"></div>
      </div>
      
      {/* 하단 범례 (빨간색 계열) */}
      {ranges.length > 0 && (
        <div className="map-legend-bottom">
          <div className="legend-title">공격 빈도</div>
          <div className="legend-scale">
            {ranges.map((range, index) => (
              <div key={index} className="legend-item-bottom">
                <div 
                  className="legend-color-box" 
                  style={{ backgroundColor: colors[index] }}
                ></div>
                <span className="legend-label">{range}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GeoMap;
