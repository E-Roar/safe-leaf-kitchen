
# Recipe Images

This directory contains recipe images for the SafeLeafKitchen app.

## Structure

### Main Recipe Images
Recipe images should be named exactly as the English recipe title, converted to lowercase with spaces replaced by hyphens and special characters removed.

### Recipe Gallery (New Feature)
- Each recipe can have its own subfolder containing multiple gallery images
- Folder name format follows the same convention as main images
- Gallery images support various aspect ratios for Pinterest-style masonry layout

## Image Naming Convention

### Example Conversions:

| Recipe Title (English) | Main Image Filename | Gallery Folder |
|------------------------|---------------------|----------------|
| Stuffed Msemen with Onion Leaves | `stuffed-msemen-with-onion-leaves.png` | `stuffed-msemen-with-onion-leaves/` |
| Barley Flatbread with Onion Leaves | `barley-flatbread-with-onion-leaves.png` | `barley-flatbread-with-onion-leaves/` |
| Omelette with Onion Leaves | `omelette-with-onion-leaves.png` | `omelette-with-onion-leaves/` |
| Powdered Dried Onion Leaves | `powdered-dried-onion-leaves.png` | `powdered-dried-onion-leaves/` |

## Gallery Structure

### Gallery Image Types
- `ingredients.png` - Ingredients preparation (aspect ratio: 1.2)
- `preparation.png` - Preparation steps (aspect ratio: 0.75)
- `cooking.png` - Cooking process (aspect ratio: 1.5)
- `final.png` - Final dish (aspect ratio: 1.0)
- `served.png` - Plated/served dish (aspect ratio: 1.3)
- `detail.png` - Close-up details (aspect ratio: 0.8)
- `close-up.png` - Macro shots (aspect ratio: 1.1)
- `plating.png` - Plating process (aspect ratio: 1.4)
- `gallery-1.png` to `gallery-N.png` - Additional images (random aspect ratios)

### Example Folder Structure
```
recipes/
├── README.md
├── omelette-with-onion-leaves.png          # Main recipe image (square)
├── omelette-with-onion-leaves/             # Gallery folder
│   ├── ingredients.png
│   ├── preparation.png
│   ├── cooking.png
│   ├── final.png
│   ├── served.png
│   ├── detail.png
│   ├── close-up.png
│   ├── plating.png
│   ├── gallery-1.png
│   ├── gallery-2.png
│   ├── gallery-3.png
│   └── gallery-4.png
└── stuffed-msemen-with-onion-leaves/
    ├── ingredients.png
    ├── preparation.png
    └── ...
```

## Image Requirements

### Main Images
- **Format**: PNG
- **Aspect Ratio**: Square (1:1) - displayed as square in recipe page
- **Resolution**: Minimum 400x400px, recommended 800x800px
- **File Size**: Keep under 300KB for optimal loading

### Gallery Images
- **Format**: PNG only (standardized format)
- **Aspect Ratios**: Various (0.6 to 1.8) for masonry layout diversity
- **Resolution**: Minimum 300px width, recommended 600px width
- **File Size**: Keep under 200KB each
- **Loading**: Images are loaded lazily and dynamically

## Current Recipe Images Needed

1. `stuffed-msemen-with-onion-leaves.png`
2. `barley-flatbread-with-onion-leaves.png`
3. `omelette-with-onion-leaves.png`
4. `powdered-dried-onion-leaves.png`

## Dynamic Loading Features

The masonry gallery component automatically:
- Loads images from the recipe's subfolder
- Handles different aspect ratios for Pinterest-style layout
- Provides loading states and error handling
- Shows hover effects and image information
- Adapts to different screen sizes (2-4 columns)
- Removes failed images gracefully

## Fallback

If a main image is not found, the app will display a placeholder with a chef hat icon.
If gallery images are not found, they are simply not displayed (no broken images).

## Adding New Recipe Images

1. **Main Image**: Add `{recipe-title-kebab-case}.png` to `/public/images/recipes/`
2. **Gallery**: Create folder `/public/images/recipes/{recipe-title-kebab-case}/`
3. **Gallery Images**: Add various images following the naming convention
4. **Testing**: Images appear automatically when the recipe is viewed

No code changes required - images are discovered and loaded dynamically!
