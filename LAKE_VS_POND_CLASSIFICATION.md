# Lake vs Pond Classification Strategy

## Analysis Results

From analyzing 1,127 waterbodies:
- **949 records** have FGEN = "Lake/Pond" (ambiguous)
- **157 records** have "Lake" in name
- **872 records** have "Pond" in name
- **9 records** have both "Lake" and "Pond" in name
- **89 records** have neither
- **Median size**: 23.30 acres

## Classification Rules (Priority Order)

### 1. **Name Pattern** (Most Reliable)
- If name contains "Lake" (and NOT "Pond") → **Lake**
- If name contains "Pond" (and NOT "Lake") → **Pond**
- Example: "NORTH MILL POND" → Pond, "WINNIPESAUKEE LAKE" → Lake

### 2. **Size Threshold** (For Ambiguous Cases)
- If FGEN = "Lake/Pond" and no clear name pattern:
  - **> 50 acres** → **Lake**
  - **≤ 50 acres** → **Pond**
- Based on median size of 23.30 acres, most ponds are smaller

### 3. **FGEN Field** (Fallback)
- If FGEN = "Lake" → **Lake**
- If FGEN = "Pond" → **Pond**
- If FGEN = "River/Strea" → **River**

## Implementation

The classification logic is implemented in `scripts/fetch_arcgis_data.py`:

```python
# Step 1: Check name pattern
if 'LAKE' in name and 'POND' not in name:
    water_type = 'Lake'
elif 'POND' in name and 'LAKE' not in name:
    water_type = 'Pond'
    
# Step 2: For "Lake/Pond" ambiguous cases, use size
elif fgen == 'Lake/Pond':
    if acres > 50:
        water_type = 'Lake'
    else:
        water_type = 'Pond'
```

## Results

This approach will correctly classify:
- **~872 ponds** (by name)
- **~157 lakes** (by name)
- **~949 ambiguous** cases (by size threshold)
- **~89 unnamed** cases (by FGEN or size)

## Rationale

1. **Name is most reliable**: If it's called "Pond" in the name, it's likely a pond
2. **Size threshold**: 50 acres is a reasonable cutoff (median is 23 acres)
3. **Default to Pond**: For truly ambiguous cases, default to Pond since most waterbodies are ponds

## Future Improvements

- Could use depth data if available
- Could use additional classification fields
- Could allow user to override classifications

