# Data Coverage for Filters

This document explains what data is available from ArcGIS and how it maps to your filter requirements.

## ✅ Questions Answered

### 1. Will all data be put into CSV and JSON files?
**YES!** When you run the script:
- **CSV file**: `data/nh_fishing_locations.csv` - Easy to view/edit in Excel
- **JSON file**: `data/nh_fishing_locations.json` - Used by the React app (preserves data types)

Both files contain the same data, just different formats.

---

### 2. Can you obtain all relevant data for the filters?

**Mostly YES**, with some notes:

#### ✅ **Species Filter** - FULLY SUPPORTED
- **Available**: ArcGIS has `SPECIES`, `Species`, or `FISH` field
- **Format**: May be comma-separated string or array
- **Script handles**: Automatically normalizes to array format
- **Your species list**: All 20 species should be in the data

#### ✅ **Water Type Filter** - FULLY SUPPORTED
- **Available**: ArcGIS has `TYPE`, `WaterType`, or `CLASS` field
- **Values**: Should match your options (Lake, River, Pond)
- **Script handles**: Extracts and normalizes

#### ✅ **Radius Filter** - FULLY SUPPORTED
- **Available**: Coordinates (latitude/longitude) from geometry
- **Calculation**: Script extracts coordinates, app calculates distance
- **Works with**: Your selected location on map

#### ⚠️ **Date/Season Filter** - PARTIALLY SUPPORTED
- **Available**: May have `SEASON_START`, `SEASON_END`, or dates in regulations
- **Challenge**: ArcGIS may not always have explicit season dates
- **Fallback**: If no season dates, assume year-round fishing
- **Script handles**: Extracts if available, sets to `None` if not

#### ⚠️ **Catch & Release Filter** - PARTIALLY SUPPORTED
- **Available**: May have dedicated field or be in regulations text
- **Challenge**: Not all waterbodies may have explicit catch & release info
- **Script handles**: 
  - Looks for `CATCH_RELEASE`, `CatchRelease` fields
  - Tries to infer from regulations text ("catch and release", "C&R", etc.)
  - Sets to `None` if unknown
- **Filter logic**: Can filter by "Yes" (only show where allowed) or "No" (show where not required)

---

### 3. Will PDFs be downloaded so users can click on them?

**YES!** Here's how it works:

#### PDF Download Process:
1. **Script downloads PDFs** to `data/bathy_pdfs/` directory
2. **Each PDF is named**: `{id}_{waterbody_name}.pdf` (e.g., `1_Lake_Winnipesaukee.pdf`)
3. **Waterbody record updated** with local path: `bathy_pdfs/1_Lake_Winnipesaukee.pdf`

#### In Your App:
- **Display**: Show a "View Bathymetry Map" button/link on each result card
- **Access**: PDFs will be in `public/bathy_pdfs/` (or served from `data/bathy_pdfs/`)
- **User clicks**: Opens PDF in new tab or downloads it
- **Fallback**: If PDF not downloaded, can link to original ArcGIS URL

#### Example Implementation:
```jsx
// In ResultCard.jsx
{waterbody.bathy_pdf_local && (
  <a 
    href={`/${waterbody.bathy_pdf_local}`} 
    target="_blank"
    className="bathy-link"
  >
    📊 View Depth Map
  </a>
)}
```

---

## Data Structure Summary

After running the script, each waterbody will have:

```json
{
  "id": 1,
  "name": "Lake Winnipesaukee",
  "town": "Moultonborough",
  "water_type": "Lake",                    // ✅ For water type filter
  "latitude": 43.6034,                     // ✅ For radius calculation
  "longitude": -71.3445,                   // ✅ For radius calculation
  "species": ["Largemouth Bass", ...],     // ✅ For species filter
  "catch_release_allowed": "Yes",          // ⚠️ For catch & release filter (may be null)
  "season_start": "2024-01-01",            // ⚠️ For date filter (may be null)
  "season_end": "2024-12-31",              // ⚠️ For date filter (may be null)
  "bathy_pdf_url": "https://...",          // Original URL
  "bathy_pdf_local": "bathy_pdfs/1_...",  // ✅ Local path for user access
  "acres": 72000,
  "depth": 180,
  "regulations": "...",
  "raw_attributes": { /* all original fields */ }
}
```

---

## What to Do After Running Script

1. **Review the data**:
   - Open `data/nh_fishing_locations.json` in a text editor
   - Check a few records to see what fields are populated
   - Look at `raw_attributes` to see all available fields

2. **Adjust field mappings** (if needed):
   - If field names don't match, edit `process_features()` function
   - Add more field name variations if data is missing

3. **Handle missing data**:
   - For catch & release: May need to manually review or infer from regulations
   - For season dates: If missing, app can assume year-round fishing
   - For PDFs: Some waterbodies may not have bathymetry maps

4. **Move PDFs to public folder**:
   ```bash
   # After downloading PDFs
   cp -r data/bathy_pdfs public/bathy_pdfs
   # Or on Windows:
   xcopy data\bathy_pdfs public\bathy_pdfs /E /I
   ```

---

## Filter Compatibility Matrix

| Filter | ArcGIS Data | Status | Notes |
|--------|------------|--------|-------|
| Species | ✅ SPECIES field | **FULLY SUPPORTED** | May need normalization |
| Water Type | ✅ TYPE/WaterType field | **FULLY SUPPORTED** | Should match your options |
| Radius | ✅ Coordinates | **FULLY SUPPORTED** | Calculated from lat/lng |
| Date | ⚠️ Season dates | **PARTIAL** | May be in regulations text |
| Catch & Release | ⚠️ C_R field or regulations | **PARTIAL** | May need inference |

---

## Next Steps

1. **Run the script** to fetch data
2. **Review the JSON output** to see what's actually available
3. **Adjust the script** if field names differ
4. **Update filter logic** to handle missing data gracefully
5. **Implement PDF viewing** in result cards

The script is designed to be flexible - you can always go back and adjust field mappings based on what you actually find in the ArcGIS data!

