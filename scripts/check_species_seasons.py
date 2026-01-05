"""
Check if the data contains species-specific season regulations
"""

import json
import re

# Load the JSON data
with open('data/nh_fishing_locations.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("Checking for species-specific season regulations...")
print("="*80)

# Check raw_attributes for any season-related fields
all_fields = set()
for record in data[:10]:  # Check first 10 records
    if 'raw_attributes' in record:
        all_fields.update(record['raw_attributes'].keys())

print("\nAll fields in raw_attributes (sample):")
for field in sorted(all_fields):
    print(f"  {field}")

# Check regulations text for season mentions
season_keywords = ['season', 'open', 'close', 'may', 'june', 'july', 'august', 'september', 'october', 'april', 'march']
species_keywords = ['trout', 'bass', 'salmon', 'pickerel', 'pike', 'perch', 'crappie', 'walleye']

regulations_with_seasons = []
regulations_with_species = []

for record in data:
    reg = record.get('regulations', '').lower()
    if reg:
        # Check for season mentions
        if any(keyword in reg for keyword in season_keywords):
            regulations_with_seasons.append({
                'name': record.get('name'),
                'regulations': record.get('regulations')
            })
        # Check for species mentions
        if any(keyword in reg for keyword in species_keywords):
            regulations_with_species.append({
                'name': record.get('name'),
                'species': record.get('species', []),
                'regulations': record.get('regulations')
            })

print(f"\n\nRecords with season-related text: {len(regulations_with_seasons)}")
print("Sample regulations with season mentions:")
for r in regulations_with_seasons[:5]:
    print(f"  {r['name']}: {r['regulations']}")

print(f"\n\nRecords with species mentions in regulations: {len(regulations_with_species)}")
print("Sample regulations with species mentions:")
for r in regulations_with_species[:5]:
    print(f"  {r['name']}: {r['regulations']}")
    print(f"    Species: {r['species']}")

# Check if there are any structured fields for seasons
print("\n\nChecking for structured season fields...")
sample_record = data[0]
if 'raw_attributes' in sample_record:
    attrs = sample_record['raw_attributes']
    season_fields = {k: v for k, v in attrs.items() if any(word in k.upper() for word in ['SEASON', 'OPEN', 'CLOSE', 'DATE', 'REG'])}
    if season_fields:
        print("Found potential season fields:")
        for k, v in season_fields.items():
            print(f"  {k}: {v}")
    else:
        print("  No obvious season-related fields found in raw_attributes")

