"""
Analyze data to determine how to differentiate between lakes and ponds
"""

import json

# Load the JSON data
with open('data/nh_fishing_locations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Analyzing Lake vs Pond differentiation...")
print("="*80)

# Analyze FGEN field
fgen_values = {}
for record in data:
    fgen = record.get('raw_attributes', {}).get('FGEN', '').strip()
    if fgen and fgen != ' ':
        fgen_values[fgen] = fgen_values.get(fgen, 0) + 1

print("\n1. FGEN Field Values:")
for fgen, count in sorted(fgen_values.items(), key=lambda x: -x[1]):
    print(f"   '{fgen}': {count} records")

# Analyze name patterns
name_patterns = {
    'contains_lake': 0,
    'contains_pond': 0,
    'contains_both': 0,
    'contains_neither': 0
}

for record in data:
    name = (record.get('name') or '').upper()
    has_lake = 'LAKE' in name
    has_pond = 'POND' in name
    if has_lake and has_pond:
        name_patterns['contains_both'] += 1
    elif has_lake:
        name_patterns['contains_lake'] += 1
    elif has_pond:
        name_patterns['contains_pond'] += 1
    else:
        name_patterns['contains_neither'] += 1

print("\n2. Name Patterns:")
for pattern, count in name_patterns.items():
    print(f"   {pattern}: {count} records")

# Analyze acres distribution
acres_data = []
for record in data:
    acres = record.get('acres')
    if acres and acres > 0:
        fgen = record.get('raw_attributes', {}).get('FGEN', '').strip()
        name = record.get('name', '').upper()
        acres_data.append({
            'acres': acres,
            'fgen': fgen,
            'name': name,
            'has_lake_in_name': 'LAKE' in name,
            'has_pond_in_name': 'POND' in name
        })

acres_data.sort(key=lambda x: x['acres'])

print(f"\n3. Acres Distribution (out of {len(acres_data)} records with acres data):")
print(f"   Min: {acres_data[0]['acres']:.2f} acres")
print(f"   Max: {acres_data[-1]['acres']:.2f} acres")
print(f"   Median: {acres_data[len(acres_data)//2]['acres']:.2f} acres")

# Analyze by FGEN and name
print("\n4. Sample Records with 'Lake/Pond' FGEN:")
lake_pond_samples = []
for record in data:
    fgen = record.get('raw_attributes', {}).get('FGEN', '').strip()
    if fgen == 'Lake/Pond':
        name = record.get('name', '')
        acres = record.get('acres')
        lake_pond_samples.append({'name': name, 'acres': acres})
        if len(lake_pond_samples) >= 20:
            break

for sample in lake_pond_samples[:10]:
    print(f"   {sample['name']}: {sample['acres']:.2f} acres" if sample['acres'] else f"   {sample['name']}: no acres data")

# Suggest classification rules
print("\n" + "="*80)
print("SUGGESTED CLASSIFICATION RULES:")
print("="*80)

# Count how many would be classified as Lake vs Pond using different rules
rule1_lake = 0  # Name contains "Lake"
rule1_pond = 0  # Name contains "Pond"
rule1_ambiguous = 0  # Neither or both

rule2_lake = 0  # Acres > threshold (e.g., 50 acres)
rule2_pond = 0  # Acres <= threshold
rule2_no_data = 0  # No acres data

for record in data:
    name = (record.get('name') or '').upper()
    acres = record.get('acres')
    has_lake = 'LAKE' in name
    has_pond = 'POND' in name
    
    # Rule 1: Name-based
    if has_lake and not has_pond:
        rule1_lake += 1
    elif has_pond and not has_lake:
        rule1_pond += 1
    else:
        rule1_ambiguous += 1
    
    # Rule 2: Size-based (50 acres threshold)
    if acres:
        if acres > 50:
            rule2_lake += 1
        else:
            rule2_pond += 1
    else:
        rule2_no_data += 1

print("\nRule 1: Name-based classification")
print(f"   Lake (name contains 'Lake'): {rule1_lake}")
print(f"   Pond (name contains 'Pond'): {rule1_pond}")
print(f"   Ambiguous (neither or both): {rule1_ambiguous}")

print("\nRule 2: Size-based classification (50 acres threshold)")
print(f"   Lake (>50 acres): {rule2_lake}")
print(f"   Pond (<=50 acres): {rule2_pond}")
print(f"   No data: {rule2_no_data}")

# Combined rule
print("\n" + "="*80)
print("RECOMMENDED APPROACH:")
print("="*80)
print("""
1. PRIMARY: Use name pattern
   - If name contains "Lake" (and not "Pond") → Lake
   - If name contains "Pond" (and not "Lake") → Pond
   
2. SECONDARY: Use size (for ambiguous cases)
   - If FGEN = "Lake/Pond" and no clear name pattern:
     - > 50 acres → Lake
     - <= 50 acres → Pond
   
3. FALLBACK: Use FGEN
   - If FGEN = "Lake" → Lake
   - If FGEN = "Pond" → Pond
   - If FGEN = "Lake/Pond" and no other info → default to Lake (or user preference)
""")

