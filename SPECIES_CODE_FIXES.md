# Species Code Mapping Fixes

## Updates Made Based on Official NH Fish & Game Codes

### ✅ Fixed Mappings

1. **BT = Brown Trout** (was incorrectly mapped to Brook Trout)
   - Official: BT = Brown Trout (*Salmo trutta*)
   - EBT = Eastern Brook Trout/Brook Trout (*Salvelinus fontinalis*)

2. **CSF = Pumpkinseed** (was using PS)
   - Official code: CSF = Pumpkinseed (*Lepomis gibbosus*)
   - PS kept as alternative for backward compatibility

3. **WLE = Walleye** (was using W)
   - Official code: WLE = Walleye (*Sander vitreus*)
   - W kept as alternative

4. **ECP = Chain Pickerel** (was correct, but now confirmed)
   - Official code: ECP = Chain Pickerel (*Esox niger*)

5. **BC = Black Crappie** (was correct, now confirmed)
   - Official code: BC = Black Crappie (*Pomoxis nigromaculatus*)

### ✅ Added Missing Codes

Based on official NH Fish & Game abbreviations and codes found in data:

- **RS** = Rainbow Smelt
- **LW** = Lake Whitefish  
- **RW** = Round Whitefish
- **RBS** = Redbreast Sunfish
- **BDS** = Banded Sunfish
- **RFP** = Redfin Pickerel
- **CRP** = Common Carp (official code, C kept as alternative)
- **CWS** = Common White Sucker
- **LNS** = Longnose Sucker
- **CCS** = Creek Chubsucker
- **MMT** = Margined Madtom
- **AE** = American Eel
- **AW** = Alewife
- **BB** = Blueback Herring
- **AS** = American Shad
- **BDK** = Banded Killifish
- **SL** = Sea Lamprey
- **ABL** = American Brook Lamprey
- **TD** = Tessellated Darter
- **SD** = Swamp Darter
- **SS** = Slimy Sculpin
- **CC** = Creek Chub
- **LC** = Lake Chub
- **GS** = Golden Shiner
- **CS** = Common Shiner
- **BS** = Bridle Shiner
- **STS** = Spottail Shiner
- **BND** = Blacknose Dace
- **LND** = Longnose Dace
- **NRD** = Northern Redbelly Dace
- **FD** = Finescale Dace
- **FHM** = Fathead Minnow
- **GF** = Goldfish
- **ATS** = Atlantic Salmon

### Codes Found in Data

From analysis of actual data, these codes appear:
- AE, BBH, BC, BG, BRB, BT, CFS, CSF, EBT, ECP, EPC, LLS, LMB, LT, LW, NP, RB, RS, RT, SMB, WLE, WP, YP

All are now properly mapped!

### Source

Official NH Fish & Game species abbreviations:
https://www.wildlife.nh.gov/sites/g/files/ehbemt746/files/inline-images/fish-abbreviations-update.pdf

