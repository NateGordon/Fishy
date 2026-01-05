"""
Quick script to analyze the JSON data structure and identify any missing or problematic fields
"""

import json

# Load the JSON data
with open('data/nh_fishing_locations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total waterbodies: {len(data)}")
print("\n" + "="*80)
print("FIELD ANALYSIS")
print("="*80)

# Check what fields exist
all_fields = set()
for record in data:
    all_fields.update(record.keys())

print(f"\nAll fields in records: {sorted(all_fields)}")

# Analyze key fields
print("\n" + "="*80)
print("KEY FIELD ANALYSIS")
print("="*80)

# 1. Water Type
water_types = {}
fgen_values = {}
for record in data:
    wt = record.get('water_type', '')
    fgen = record.get('raw_attributes', {}).get('FGEN', '')
    water_types[wt] = water_types.get(wt, 0) + 1
    if fgen and fgen.strip() and fgen != ' ':
        fgen_values[fgen] = fgen_values.get(fgen, 0) + 1

print(f"\n1. Water Type (water_type field):")
for wt, count in sorted(water_types.items(), key=lambda x: -x[1])[:10]:
    print(f"   '{wt}': {count} records")

print(f"\n   FGEN field (from raw_attributes) - better water type info:")
for fgen, count in sorted(fgen_values.items(), key=lambda x: -x[1])[:10]:
    print(f"   '{fgen}': {count} records")

# 2. Species
species_counts = {}
empty_species = 0
for record in data:
    species = record.get('species', [])
    if not species or len(species) == 0:
        empty_species += 1
    else:
        for s in species:
            species_counts[s] = species_counts.get(s, 0) + 1

print(f"\n2. Species:")
print(f"   Records with no species: {empty_species} ({empty_species/len(data)*100:.1f}%)")
print(f"   Top 10 species found:")
for species, count in sorted(species_counts.items(), key=lambda x: -x[1])[:10]:
    print(f"   {species}: {count} records")

# 3. Catch & Release
cr_values = {}
for record in data:
    cr = record.get('catch_release_allowed')
    cr_str = str(cr) if cr is not None else 'null'
    cr_values[cr_str] = cr_values.get(cr_str, 0) + 1

print(f"\n3. Catch & Release Allowed:")
for cr, count in sorted(cr_values.items(), key=lambda x: -x[1]):
    print(f"   {cr}: {count} records")

# 4. Coordinates
missing_coords = 0
for record in data:
    if record.get('latitude') is None or record.get('longitude') is None:
        missing_coords += 1

print(f"\n4. Coordinates:")
print(f"   Records with missing coordinates: {missing_coords} ({missing_coords/len(data)*100:.1f}%)")

# 5. Bathymetry PDFs
has_pdf = 0
for record in data:
    if record.get('bathy_pdf_url') and record.get('bathy_pdf_url').strip():
        has_pdf += 1

print(f"\n5. Bathymetry PDFs:")
print(f"   Records with PDF URLs: {has_pdf} ({has_pdf/len(data)*100:.1f}%)")

# 6. Regulations/Notes
has_regulations = 0
for record in data:
    reg = record.get('regulations', '')
    if reg and reg.strip():
        has_regulations += 1

print(f"\n6. Regulations:")
print(f"   Records with regulations: {has_regulations} ({has_regulations/len(data)*100:.1f}%)")

# 7. Depth
has_depth = 0
for record in data:
    if record.get('depth') is not None:
        has_depth += 1

print(f"\n7. Depth:")
print(f"   Records with depth data: {has_depth} ({has_depth/len(data)*100:.1f}%)")

# 8. Sample record structure
print("\n" + "="*80)
print("SAMPLE RECORD (first record with species)")
print("="*80)
for record in data:
    if record.get('species') and len(record.get('species', [])) > 0:
        sample = {k: v for k, v in record.items() if k != 'raw_attributes'}
        print(json.dumps(sample, indent=2))
        break

print("\n" + "="*80)
print("RECOMMENDATIONS")
print("="*80)
print("\n1. Water Type: Use FGEN field instead of WB_CLASS for better readability")
print("   - FGEN has values like 'Lake/Pond', 'River', etc.")
print("   - WB_CLASS has codes like 'B', 'A', etc.")
print("\n2. Species: Some records missing species data (may be in raw_attributes)")
print("\n3. Catch & Release: Mostly null, but some inferred from regulations")
print("\n4. Coordinates: All records should have coordinates ✅")
print("\n5. Consider adding FGEN as water_type for better filtering")

