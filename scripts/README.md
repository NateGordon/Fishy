# Data Fetching Scripts

This directory contains scripts to fetch NH Fish & Game waterbody data from the ArcGIS REST API.

## ArcGIS Data Source

The NH Fish & Game uses an ArcGIS Web App that exposes data through REST FeatureServer endpoints:
- Web App: https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43
- Data is available as clean JSON (no HTML scraping needed)

## Scripts

### Python Version: `fetch_arcgis_data.py`

**Requirements**:
```bash
pip install requests
```

**Usage**:
```bash
python scripts/fetch_arcgis_data.py
```

**Features**:
- Auto-discovers FeatureServer endpoint
- Queries all waterbodies using `where=1=1`
- Extracts coordinates from geometry
- Normalizes species data
- Saves to CSV and JSON
- Optionally downloads bathymetry PDFs

### Node.js Version: `fetch_arcgis_data.js`

**Requirements**: None (uses native Node.js modules)

**Usage**:
```bash
node scripts/fetch_arcgis_data.js
```

**Features**: Same as Python version

## Finding the FeatureServer URL

If auto-discovery fails, you can find the FeatureServer URL manually:

1. Open the ArcGIS web app in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Filter by "query" or "FeatureServer"
5. Look for requests like: `.../FeatureServer/0/query?...`
6. Copy the base URL (everything before `/query`)

Common patterns:
- `https://nhfg.maps.arcgis.com/arcgis/rest/services/[ServiceName]/FeatureServer/0`
- May be on a different subdomain or path

## Output Files

After running the script, you'll get:

- `data/nh_fishing_locations.csv` - CSV format (easy to view/edit)
- `data/nh_fishing_locations.json` - JSON format (for app consumption)
- `data/bathy_pdfs/` - Directory with downloaded PDFs (optional)

## Data Refresh

Since regulations update annually, you only need to run this script:
- **Annually** (recommended)
- Or when you notice data changes
- Or set up automated monthly refresh

## Troubleshooting

### "Could not auto-discover FeatureServer endpoint"
- Manually inspect the web app's network requests
- Edit the script to hardcode the FeatureServer URL
- Check if the service is publicly accessible

### "No 'features' key in response"
- The endpoint might be incorrect
- The service might require authentication
- Check the response structure in browser DevTools

### Missing or incorrect field names
- ArcGIS field names may vary
- Edit the `processFeatures()` function to map your specific field names
- Check `raw_attributes` in JSON output to see all available fields

## Next Steps

After fetching data:
1. Review the CSV/JSON to verify data quality
2. Adjust field mappings if needed
3. Use the data in the React app (see `src/utils/csvReader.js` or JSON loader)

