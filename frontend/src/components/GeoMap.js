import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './GeoMap.css';

function GeoMap({ data, isDarkMode }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

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
    };

    const countryNames = {
      'KR': '대한민국', 'US': '미국', 'CN': '중국', 'JP': '일본',
      'RU': '러시아', 'DE': '독일', 'FR': '프랑스', 'GB': '영국',
      'BR': '브라질', 'IN': '인도',
    };

    Object.entries(data).forEach(([country, count]) => {
      const coords = countryCoordinates[country];
      if (!coords) return;

      let color = '#ffcc00';
      let radius = 8;
      if (count >= 10) {
        color = '#ff4444';
        radius = 15;
      } else if (count >= 5) {
        color = '#ff8800';
        radius = 12;
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
          공격 횟수: <span style="color: ${color}; font-weight: bold;">${count}</span>
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

  return (
    <div className="card">
      <div className="card-title">
        <i className="fas fa-globe"></i> 지역별 트래픽
      </div>
      <div className="map-container">
        <div ref={mapRef} id="geoMap"></div>
        <div className="map-legend">
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>공격 빈도</div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ff4444' }}></div>
            <span>높음 (10+)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ff8800' }}></div>
            <span>중간 (5-9)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ffcc00' }}></div>
            <span>낮음 (1-4)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeoMap;
