# Quick Start Guide - Modern UI Dashboard

## 🚀 Starting the Application

### 1. Start Backend Server
```bash
# From project root directory
python api_server.py
```
The backend will start on `http://localhost:5000`

### 2. Start Frontend Development Server
```bash
# Navigate to frontend directory
cd frontend

# Start React development server
npm start
```
The frontend will start on `http://localhost:3000` and automatically open in your browser.

---

## 🎨 Modern UI Features

### Theme Switching
- **Light Mode**: Clean, professional appearance with white panels
- **Dark Mode**: Modern monitoring tool aesthetic with dark blue panels
- **Toggle**: Click the sun/moon icon in the top-right corner
- **Persistence**: Your theme preference is saved automatically

### Dashboard Components

#### 1. Top Navigation Bar
- **Logo & Breadcrumbs**: Shows current location (Home > Dashboards > Security Monitor)
- **Search Bar**: Search logs, IPs, and attack types (with KQL filter option)
- **Date Range Picker**: Select time range for data (Last 15 minutes, 1 hour, 24 hours, etc.)
- **Action Buttons**:
  - 🔄 Refresh: Reload all dashboard data
  - 🌙/☀️ Theme Toggle: Switch between light and dark mode
  - 📥 Download: Generate and download PDF report
  - 👤 User Menu: User profile access

#### 2. Metric Cards (Top Row)
Four key metrics displayed prominently:
- **Total Events**: All security events in the selected time range
- **Blocked Attacks**: Successfully blocked malicious requests
- **Critical Threats**: High-risk events (score ≥ 85)
- **Allowed Traffic**: Legitimate requests that passed through

Each card shows:
- Current value
- Percentage change
- Trend indicator (↑ positive, ↓ negative)
- Descriptive subtitle

#### 3. Traffic Overview Chart
- **Type**: Line chart with gradient fill
- **Data**: Daily traffic patterns over the last 7 days
- **Features**:
  - Smooth curves for better visualization
  - Hover to see exact values
  - Expand button for detailed view
  - Download chart data

#### 4. Attack Type Distribution
- **Type**: Doughnut chart with center total
- **Data**: Breakdown of detected attack patterns
- **Features**:
  - Color-coded by attack type
  - Percentage and count in tooltips
  - Legend on the right side
  - Center displays total attacks

#### 5. Geographic Distribution
- **Type**: Horizontal bar chart list
- **Data**: Attack sources by country (top 10)
- **Features**:
  - Progress bars showing relative volume
  - Country name and exact count
  - Gradient-filled bars
  - Sorted by attack count

#### 6. Recent Security Events Table
- **Type**: Modern data table
- **Data**: Latest 10 security events
- **Columns**:
  - Timestamp (local time format)
  - Source IP (monospace code style)
  - Country of origin
  - Attack Type (badge)
  - Action taken (BLOCK/ALLOW badge)
  - Risk Score (color-coded badge)
- **Features**:
  - Hover highlighting
  - Color-coded status badges
  - Filter and export buttons
  - Responsive scrolling

---

## 📱 Responsive Design

### Desktop (>1600px)
- Full 12-column grid layout
- All components visible side-by-side
- Optimal viewing experience

### Tablet (768px - 1600px)
- 6-column grid layout
- Components reflow to 2 columns
- Maintained readability

### Mobile (<768px)
- Single column stack
- Touch-friendly controls
- Optimized typography
- Collapsible navigation

---

## 🎨 Color System

### Light Theme Colors
- Background: Light gray (#F5F5F5)
- Panels: White (#FFFFFF)
- Text: Dark blue (#17293D)
- Accents: Primary blue (#1970DF)

### Dark Theme Colors
- Background: Very dark blue (#0F1419)
- Panels: Dark blue (#172A3D)
- Text: Light gray (#F9FAFB)
- Accents: Light blue (#609EFF)

### Status Colors (Both Themes)
- Success: Green (#9EF06F)
- Warning: Orange (#FFA726)
- Danger: Red (#FB4C2E)
- Info: Blue (#609EFF)

---

## 🔧 Keyboard Shortcuts

Currently, the dashboard uses mouse/touch interactions. Keyboard shortcuts can be added in future updates.

---

## 📊 Data Refresh

### Automatic Refresh
- Currently manual refresh only
- Click the refresh button (🔄) to reload data

### Manual Refresh
- Click refresh button in top-right corner
- All dashboard components update simultaneously
- Loading indicators show during data fetch

---

## 🐛 Troubleshooting

### Dashboard Not Loading
1. Check backend is running: `http://localhost:5000/api/logs`
2. Check browser console for errors (F12)
3. Verify proxy setting in `package.json`: `"proxy": "http://localhost:5000"`

### Theme Not Switching
1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()`
3. Refresh the page

### Charts Not Displaying
1. Verify Chart.js is installed: `npm list chart.js`
2. Check browser console for plugin errors
3. Ensure data is loading from API

### Styling Issues
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check theme.css is loaded in Network tab

---

## 🔄 Switching Back to Old UI (If Needed)

If you need to temporarily use the old UI:

1. Edit `frontend/src/index.js`:
```javascript
// Change this line:
import AppModern from './AppModern';

// To this:
import App from './App';

// And change this line:
<AppModern />

// To this:
<App />
```

2. Save and the page will auto-reload with the old UI

---

## 📝 API Endpoints Used

The dashboard connects to these backend endpoints:

- `GET /api/geographic-data` - Geographic distribution data
- `GET /api/hourly-attacks` - Traffic timeline data
- `GET /api/monthly-attack-types` - Attack type breakdown
- `GET /api/logs?page=1&per_page=1000` - Security event logs
- `GET /api/download-report` - PDF report generation

---

## 🎯 Best Practices

### For Best Performance
- Use Chrome, Firefox, or Edge (latest versions)
- Enable hardware acceleration in browser
- Close unused browser tabs
- Use appropriate date range (shorter = faster)

### For Best Experience
- Use desktop or tablet for full features
- Enable JavaScript
- Allow pop-ups for PDF downloads
- Use modern browser (2023+)

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify backend is running and accessible
3. Check network tab for failed API requests
4. Review `MODERN_UI_IMPLEMENTATION.md` for technical details

---

## ✨ What's New in Modern UI

Compared to the old UI, the modern version features:

✅ **Professional Design**
- Grafana/Elastic Dashboard inspired
- Clean, modern aesthetic
- Consistent spacing and typography

✅ **Better Theme Support**
- True light and dark themes
- Smooth transitions
- Persistent preferences

✅ **Improved Responsiveness**
- 12-column grid system
- Mobile-first approach
- Touch-friendly controls

✅ **Enhanced Visualizations**
- Gradient-filled charts
- Smooth animations
- Interactive tooltips

✅ **Better UX**
- Intuitive navigation
- Clear visual hierarchy
- Accessible design

---

## 🎉 Enjoy Your New Dashboard!

The modern UI is designed to provide a professional, efficient, and enjoyable experience for monitoring your WAF security events. Explore the features, switch themes, and customize your view!
