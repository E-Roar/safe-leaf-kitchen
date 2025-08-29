# Video Assets

This directory contains video assets for the SafeLeafKitchen app.

## Video Tutorial

### Main Tutorial Video
- **Filename**: `safeleafkitchen-tutorial.mp4`
- **Purpose**: Application walkthrough and tutorial for the homepage video section
- **Location**: Displayed on the homepage just under the hero section
- **Recommended specs**:
  - Format: MP4 (H.264 codec recommended for maximum compatibility)
  - Resolution: 1920x1080 (Full HD) or 1280x720 (HD)
  - Aspect Ratio: 16:9
  - Frame Rate: 30fps or 60fps
  - Duration: 3-5 minutes for optimal user engagement
  - File size: Recommended under 50MB for good loading performance

### Video Thumbnail
- **Filename**: `video-thumbnail.png`
- **Purpose**: Poster image displayed before video loads/plays
- **Location**: Referenced in the homepage video element
- **Recommended specs**:
  - Format: PNG (for transparency support) or JPG
  - Resolution: 1920x1080 (same as video resolution)
  - Aspect Ratio: 16:9 (matches video)
  - Size: Optimized for web (under 500KB)

## Video Content Suggestions

### Tutorial Should Cover:
1. **App Introduction** (0-30s)
   - Welcome to SafeLeafKitchen
   - Brief overview of the app's purpose

2. **Leaf Scanning Feature** (30s-1:30min)
   - How to use the camera scan
   - Demonstrating leaf detection
   - Understanding detection results

3. **Chat Assistant** (1:30-2:30min)
   - Asking questions about leaves
   - Getting nutritional information
   - Recipe suggestions

4. **Recipe Exploration** (2:30-3:30min)
   - Browsing recipe collection
   - Viewing recipe details
   - Using favorites feature

5. **Impact Tracking** (3:30-4min)
   - Understanding personal impact
   - Environmental benefits
   - Food waste reduction

6. **Call to Action** (4-5min)
   - Encouraging app usage
   - Highlighting key benefits

## Integration Details

The video is integrated into the homepage using an HTML5 video element with:
- Native browser controls
- Responsive design (aspect-video class)
- Glass morphism styling
- Hover effects for better visual integration
- Fallback content for unsupported browsers
- Metadata preloading for faster initial loading

## File Paths Referenced in Code:
- Video source: `/videos/safeleafkitchen-tutorial.mp4`
- Thumbnail poster: `/images/video-thumbnail.png`

## Performance Considerations:
- Video uses `preload="metadata"` to load only basic info initially
- Thumbnail image should be optimized for fast loading
- Consider providing multiple video formats for better browser support
- Monitor file sizes to ensure good loading performance across devices

## Accessibility:
- Consider adding captions/subtitles for better accessibility
- Provide transcript if needed for screen readers
- Ensure good contrast in thumbnail image

## Browser Support:
The current implementation supports modern browsers with HTML5 video support. For maximum compatibility, consider:
- MP4 format with H.264 codec (widely supported)
- WebM format as fallback for some browsers
- Proper fallback content for older browsers