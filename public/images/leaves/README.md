# Leaf Images

This directory contains botanical leaf images for the SafeLeafKitchen app.

## Structure

### Main Leaf Images
- Each leaf should have a main image named after the leaf name (kebab-case)
- Format: `{leaf-name-kebab-case}.png`
- Example: `onion-leaves.png`

### Leaf Gallery (Pinterest-style Masonry)
- Each leaf can have its own subfolder containing multiple gallery images
- Folder name format follows the same convention as main images
- Gallery images support various aspect ratios for Pinterest-style masonry layout

## Image Naming Convention

### Example Conversions:

| Leaf Name (English) | Main Image Filename | Gallery Folder |
|---------------------|---------------------|----------------|
| Onion Leaves | `onion-leaves.png` | `onion-leaves/` |
| Fennel Leaves | `fennel-leaves.png` | `fennel-leaves/` |
| Carrot Leaves | `carrot-leaves.png` | `carrot-leaves/` |
| Garlic Leaves | `garlic-leaves.png` | `garlic-leaves/` |

## Gallery Structure

### Gallery Image Types (Botanical Focus)
- `whole-plant.png` - Complete plant view (aspect ratio: 1.4)
- `leaf-detail.png` - Detailed leaf structure (aspect ratio: 1.2)
- `texture-close-up.png` - Leaf surface texture (aspect ratio: 0.8)
- `fresh-leaves.png` - Fresh leaf specimens (aspect ratio: 1.3)
- `dried-leaves.png` - Dried leaf specimens (aspect ratio: 1.1)
- `cross-section.png` - Leaf cross-section (aspect ratio: 0.75)
- `surface-detail.png` - Surface details (aspect ratio: 0.9)
- `veins-pattern.png` - Vein patterns (aspect ratio: 1.0)
- `growth-stages.png` - Growth stages (aspect ratio: 1.5)
- `nutrition-prep.png` - Nutritional preparation (aspect ratio: 1.2)
- `cooking-ready.png` - Cooking preparation (aspect ratio: 1.4)
- `microscopic.png` - Microscopic view (aspect ratio: 1.0)
- `gallery-1.png` to `gallery-N.png` - Additional images (random aspect ratios)

### Example Folder Structure
```
leaves/
├── README.md
├── onion-leaves.png                    # Main leaf image (square)
├── onion-leaves/                       # Gallery folder
│   ├── whole-plant.png
│   ├── leaf-detail.png
│   ├── texture-close-up.png
│   ├── fresh-leaves.png
│   ├── dried-leaves.png
│   ├── cross-section.png
│   ├── surface-detail.png
│   ├── veins-pattern.png
│   ├── growth-stages.png
│   ├── nutrition-prep.png
│   ├── cooking-ready.png
│   ├── microscopic.png
│   ├── gallery-1.png
│   ├── gallery-2.png
│   ├── gallery-3.png
│   └── gallery-4.png
└── fennel-leaves/
    ├── whole-plant.png
    ├── leaf-detail.png
    └── ...
```

## Image Requirements

### Main Images
- **Format**: PNG only
- **Aspect Ratio**: Square (1:1) for consistent display
- **Resolution**: Minimum 400x400px, recommended 800x800px
- **File Size**: Keep under 300KB for optimal loading

### Gallery Images
- **Format**: PNG only (as requested)
- **Aspect Ratios**: Various (0.7 to 1.7) for masonry layout diversity
- **Resolution**: Minimum 300px width, recommended 600px width
- **File Size**: Keep under 250KB each
- **Loading**: Images are loaded lazily and dynamically

## Current Leaf Images Needed

Based on the leaf database, main images needed:
1. `onion-leaves.png`
2. `fennel-leaves.png`
3. `carrot-leaves.png`
4. `kohlrabi-leaves.png`
5. `beet-leaves.png`
6. `radish-leaves.png`
7. `leek-leaves.png`
8. `turnip-leaves.png`
9. `artichoke-leaves.png`

## Dynamic Loading Features

The leaf gallery component automatically:
- Dynamically discovers images from the leaf's subfolder using comprehensive name matching
- Supports various naming conventions (kebab-case, snake_case, spaces, etc.)
- Handles different aspect ratios for Pinterest-style layout
- Provides loading states and error handling
- Shows botanical information on hover
- Adapts to different screen sizes (2-4 columns)
- Removes failed images gracefully

### Supported File Naming Patterns
The system automatically detects images with these naming patterns:
- **Descriptive names**: `whole-plant.png`, `leaf-detail.png`, `texture-close-up.png`
- **Your actual files**: Any descriptive filename you upload (e.g., `Onion_leaves.png`, `IMG-20191003-134515.png`)
- **Numbered patterns**: `1.png`, `2.png`, `image1.png`, `gallery-1.png`, `photo1.png`
- **Conversion patterns**: Leaf name in various formats (`onion_leaves.png`, `onion-leaves.png`)
- **Common names**: `main.png`, `primary.png`, `hero.png`, `thumbnail.png`

### Current Working Example - Onion Leaves
Your uploaded files in `/public/images/leaves/onion-leaves/`:
- ✅ `General-view-Welch-onion-plant-with-foliage-leaves-and-long-pseudostemSource.png`
- ✅ `IMG-20191003-134515.png`
- ✅ `Onion_Green_Leaves_Seeds_Open_Pollination.png`
- ✅ `Onion_leaves.png`
- ✅ `The-onion-is-grown-on-the-soil-in-the-plots.png`
- ✅ `slk (10).png`
- ✅ `the-vibrant-bundle-of-fresh-green-onions-ready-for-culinary-use-photo.png`

These should now be automatically detected and displayed in the gallery!

## Image Categories for Botanical Documentation

### Scientific Documentation
- Whole plant structure
- Leaf morphology details
- Vein patterns and arrangements
- Surface textures and characteristics
- Cross-sectional anatomy

### Practical Usage
- Fresh vs. dried specimens
- Preparation for cooking
- Nutritional preparation methods
- Growth stages identification
- Quality assessment indicators

### Educational Content
- Microscopic details
- Comparative studies
- Seasonal variations
- Identification features
- Safety characteristics

## Fallback

If a main image is not found, the app will display a placeholder with a leaf icon.
If gallery images are not found, they are simply not displayed (no broken images).

## Adding New Leaf Images

1. **Main Image**: Add `{leaf-name-kebab-case}.png` to `/public/images/leaves/`
2. **Gallery**: Create folder `/public/images/leaves/{leaf-name-kebab-case}/`
3. **Gallery Images**: Add various PNG images following the naming convention
4. **Testing**: Images appear automatically when the leaf is viewed

No code changes required - images are discovered and loaded dynamically!

## Image Quality Guidelines

- Use high-quality botanical photography
- Ensure good lighting and clear details
- Maintain consistent color accuracy
- Focus on educational and identification value
- Include various angles and perspectives
- Document different growth stages when possible