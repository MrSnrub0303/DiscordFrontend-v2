# HC Card Synchronization

This document explains how to sync HC (Home City) card data and images for the Discord Quiz Activity.

## Overview

The quiz app supports HC Card questions where players must identify Age of Empires III Home City cards by their image and name.

## File Structure

```
client/
├── hc_cards.json                    # Reference file with all card names and URLs
├── src/
│   ├── assets/
│   │   └── cards/                   # Card images (PNG format)
│   │       ├── Acupuncture.png
│   │       ├── Admiral_Tromp.png
│   │       └── ...                  # 150 total card images
│   └── utils/
│       └── cardImages.js            # Dynamic card image loader
└── sync_hc_cards.py                 # Sync script (in project root)
```

## Current Status

✅ **All 150 HC cards are synced and up to date**

- Total cards in reference file: 150
- Total card images in assets: 150
- All cards match between reference and assets

## Card Naming Convention

Card names follow this format:
- Spaces → Underscores: `"Admiral Tromp"` → `Admiral_Tromp.png`
- Remove colons and slashes: `"Card:Name/Test"` → `CardNameTest.png`
- Case-sensitive matching

## How Card Images Work

The app uses **dynamic imports** via Vite:

```javascript
// src/utils/cardImages.js
const imageModule = await import(`../assets/cards/${fileName}.png`);
const imageUrl = imageModule.default;
```

This means:
- Images are bundled by Vite during build
- No manual import statements needed
- Images are cached after first load
- Works seamlessly with Vercel deployment

## Adding New Cards

### Option 1: Automated Sync (Recommended)

1. Place the new `hc_cards.json` file in your Downloads folder
2. Run the sync script from project root:
   ```bash
   cd /path/to/discord-quiz-activity
   python3 sync_hc_cards.py
   ```
3. The script will:
   - Compare existing cards with new ones
   - Download missing card images
   - Save them with proper naming convention
   - Generate a sync report

### Option 2: Manual Addition

1. Download the card image (PNG format)
2. Rename following convention: `Card_Name_With_Underscores.png`
3. Place in `client/src/assets/cards/`
4. No code changes needed - it will work automatically

## Sync Script Features

The `sync_hc_cards.py` script:
- ✅ Compares new cards against existing assets
- ✅ Downloads only missing cards
- ✅ Follows existing naming conventions
- ✅ Handles HTTPS and SSL properly
- ✅ Provides detailed sync report
- ✅ No duplicate downloads
- ✅ Non-destructive (won't overwrite existing files)

## Card Questions in Game

HC Card questions are defined in `questions.json` with:
```json
{
  "isCard": true,
  "cardName": "Admiral Tromp",
  "cardImagePath": "client/src/assets/cards/Admiral_Tromp.png"
}
```

Players must type the exact card name to answer correctly (case-insensitive).

## Verification

To verify all cards are present:
```bash
# Count cards in assets
ls client/src/assets/cards/*.png | wc -l

# Count cards in reference
cat client/hc_cards.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)))"
```

Both should return the same number.

## Card List (150 Total)

All current cards are listed in `hc_cards.json`:
- Spanish cards (Conquistador, Unction, etc.)
- British cards (Yeomen, Siege Archery, etc.)
- French cards (Voyageur, Colbertism, etc.)
- And many more from all civilizations

## Troubleshooting

### Card image not loading in game?
1. Check filename matches exactly (including underscores)
2. Verify PNG format (not JPG or other)
3. Check file exists in `src/assets/cards/`
4. Clear browser cache and rebuild

### Sync script fails?
1. Ensure Python 3 is installed
2. Check internet connection (for downloads)
3. Verify `hc_cards.json` is in Downloads folder
4. Check write permissions on assets folder

## Important Notes

⚠️ **Do not modify:**
- `src/utils/cardImages.js` - Dynamic loader works perfectly
- Card naming convention - Existing system is consistent
- Image format - Must be PNG for Vite bundling

✅ **Safe to modify:**
- Add new card images to assets folder
- Update `hc_cards.json` reference file
- Run sync script as needed

## Last Sync

**Date:** October 17, 2025
**Status:** ✅ All 150 cards verified and synced
**Script Version:** 1.0
