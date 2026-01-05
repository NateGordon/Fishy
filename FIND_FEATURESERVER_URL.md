# How to Find the ArcGIS FeatureServer URL

The script needs the FeatureServer URL to fetch data. Here's how to find it:

## Method 1: Browser DevTools (Easiest)

1. **Open the ArcGIS Web App**:
   - Go to: https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43
   - Wait for the map to load

2. **Open Developer Tools**:
   - Press `F12` (or right-click → Inspect)
   - Go to the **Network** tab

3. **Filter the requests**:
   - In the filter box, type: `query` or `FeatureServer`
   - You should see requests like: `.../FeatureServer/0/query?...`

4. **Find the base URL**:
   - Click on one of the `query` requests
   - Look at the **Request URL** - it will look like:
     ```
     https://[something].arcgis.com/arcgis/rest/services/[ServiceName]/FeatureServer/0/query?where=...
     ```
   - Copy everything **before** `/query` - that's your FeatureServer URL!
   - Example: `https://services1.arcgis.com/abc123/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0`

5. **Use it in the script**:
   - When the script asks for the URL, paste it
   - Or edit the script and add it to the `possible_endpoints` list

## Method 2: Inspect Page Source

1. Open the web app
2. Right-click → View Page Source (or Ctrl+U)
3. Search for "FeatureServer" (Ctrl+F)
4. Look for URLs containing "FeatureServer"

## Method 3: Common Patterns to Try

The script tries these common patterns automatically. If auto-discovery fails, you can manually try:

```
https://nhfg.maps.arcgis.com/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0
https://services1.arcgis.com/[some-id]/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0
https://gis.nh.gov/arcgis/rest/services/NHFG/FeatureServer/0
```

## Once You Have the URL

### Option A: Run script interactively
```bash
python scripts/fetch_arcgis_data.py
# When prompted, paste the URL
```

### Option B: Edit the script
1. Open `scripts/fetch_arcgis_data.py`
2. Find the `discover_feature_server()` function
3. Add your URL to the `possible_endpoints` list:
   ```python
   possible_endpoints = [
       "YOUR_URL_HERE",  # Add this line
       "https://nhfg.maps.arcgis.com/arcgis/rest/services/NHFG_Waterbodies/FeatureServer/0",
       # ... rest of the list
   ]
   ```
4. Run the script again

### Option C: Test the URL directly
Open the URL in your browser with `?f=json` at the end:
```
https://[your-url]/FeatureServer/0?f=json
```

If you see JSON with "fields" and "features", you've got the right URL!

