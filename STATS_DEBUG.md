# Live Stats Debugging Guide

## Quick Test

1. **Open browser console** (F12 → Console tab)
2. **Type and run:** `testStatsEndpoint()`
   - This will test all API endpoints
   - Look for ✅ or ❌ messages

## Manual API Test

Open in browser:
- `http://localhost:3000/api/stats`
- `http://localhost:4000/api/stats`

Should return JSON like:
```json
{
  "success": true,
  "stats": {
    "homesServicedThisMonth": 2870,
    "plumbingAvgETA": "38 min avg ETA",
    "cleaningSlotsToday": "6 open today",
    "electricianDispatchTime": "Under 60 min"
  }
}
```

## Common Issues

### Backend Not Running
- Start backend: `cd Final/backend && npm start` or `node index.js`
- Default port: 3000

### CORS Errors
- Backend CORS is configured to allow all origins
- Check browser console for CORS errors

### Elements Not Found
- Check console for: "⚠️ Stats elements not found"
- Ensure index.html has elements with IDs:
  - `stats-homes-serviced`
  - `stats-plumbing`
  - `stats-cleaning`
  - `stats-electrician`

## Manual Refresh

1. Click the "Live" badge button in the stats card
2. Or run in console: `window.loadLiveStats()`

## Expected Behavior

1. On page load, stats show loading animation
2. After ~500ms, API call is made
3. Stats update with fade-in animation
4. Auto-refreshes every 30 seconds
5. On error, shows default values and retries every 10 seconds









