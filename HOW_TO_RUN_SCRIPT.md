# How to Run the Data Fetching Script

You have both Python and Node.js installed. Here are instructions for both options.

## Option 1: Python (Recommended - Easier)

### Step 1: Install Required Package
```bash
pip install requests
```

### Step 2: Run the Script
```bash
python scripts/fetch_arcgis_data.py
```

The script will:
1. Try to auto-discover the ArcGIS FeatureServer endpoint
2. Query all waterbody data
3. Save to `data/nh_fishing_locations.csv` and `data/nh_fishing_locations.json`
4. Ask if you want to download PDFs

---

## Option 2: Node.js (No Dependencies Needed)

### Step 1: Run the Script
```bash
node scripts/fetch_arcgis_data.js
```

That's it! Node.js version uses built-in modules, so no installation needed.

---

## If Auto-Discovery Fails

If the script can't find the FeatureServer endpoint automatically, you'll need to find it manually:

### Method 1: Browser DevTools
1. Open the ArcGIS web app: https://nhfg.maps.arcgis.com/apps/webappviewer/index.html?id=2243091f322449819c244c0c3b2f3f43
2. Press `F12` to open Developer Tools
3. Go to the **Network** tab
4. Filter by "query" or "FeatureServer"
5. Look for a request like: `.../FeatureServer/0/query?...`
6. Copy the base URL (everything before `/query`)
7. When the script asks, paste that URL

### Method 2: Edit the Script
You can also hardcode the URL in the script:
- Open `scripts/fetch_arcgis_data.py`
- Find the `discover_feature_server()` function
- Add your discovered URL to the `possible_endpoints` list

---

## Expected Output

After running successfully, you should see:

```
NH Fish & Game ArcGIS Data Fetcher
==================================================

Step 1: Discovering FeatureServer endpoint...
Found FeatureServer: https://...

Step 2: Querying all features from https://...
Retrieved 500 features

Step 3: Processing features...
Processed 500 waterbodies

Step 4: Saving data...
Saved 500 waterbodies to data/nh_fishing_locations.csv
Saved 500 waterbodies to data/nh_fishing_locations.json

Step 5: Downloading bathymetry PDFs...
Download bathymetry PDFs? (y/n): y
Downloading: https://...
  Saved: 1_Lake_Winnipesaukee.pdf
...

✅ Data fetch complete!
   CSV: data/nh_fishing_locations.csv
   JSON: data/nh_fishing_locations.json
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'requests'"
**Solution**: Install requests
```bash
pip install requests
```

### "Could not auto-discover FeatureServer endpoint"
**Solution**: 
- Follow the manual discovery steps above
- Or check if the ArcGIS service is publicly accessible
- The endpoint URL might have changed

### "No 'features' key in response"
**Solution**:
- The endpoint might be incorrect
- Check the response structure in browser DevTools
- The service might require authentication

### Script runs but no data
**Solution**:
- Check `data/nh_fishing_locations.json` to see what was retrieved
- Look at `raw_attributes` to see all available fields
- Field names might be different - adjust the script accordingly

---

## Next Steps After Running

1. **Check the data**: Open `data/nh_fishing_locations.json` to see what was retrieved
2. **Review field mappings**: Check if field names match what the script expects
3. **Adjust if needed**: Edit `process_features()` function if field names differ
4. **Move PDFs to public**: If you want PDFs accessible in the web app:
   ```bash
   # Windows PowerShell
   Copy-Item -Path data\bathy_pdfs\* -Destination public\bathy_pdfs\ -Recurse
   
   # Or create the directory first
   mkdir public\bathy_pdfs
   xcopy data\bathy_pdfs public\bathy_pdfs /E /I
   ```

---

## Quick Start (Python)

```bash
# 1. Install requests (one time only)
pip install requests

# 2. Run the script
python scripts/fetch_arcgis_data.py

# 3. When prompted, type 'y' to download PDFs (optional)
```

That's it! Your data will be in the `data/` folder.

