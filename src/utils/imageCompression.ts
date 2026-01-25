/**
 * Image Compression Utility for PDF Generation
 * Compresses images to reduce PDF file size while maintaining quality
 */

/**
 * Compress an image from URL to a base64 data URL
 * @param imageUrl - Source image URL (can be remote or local)
 * @param maxWidth - Maximum width in pixels (default 800)
 * @param quality - JPEG quality 0-1 (default 0.75)
 * @returns Compressed image as base64 data URL
 */
export const compressImageForPDF = async (
    imageUrl: string,
    maxWidth: number = 800,
    quality: number = 0.75
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            try {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }
                
                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG for better compression
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            // If image fails to load, return a placeholder or empty string
            console.warn(`Failed to load image: ${imageUrl}`);
            resolve('');
        };
        
        // Handle CORS by trying direct load first
        img.src = imageUrl;
    });
};

/**
 * Compress multiple images in parallel with progress tracking
 * @param imageUrls - Array of image URLs to compress
 * @param onProgress - Callback for progress updates (0-100)
 * @param maxWidth - Maximum width in pixels
 * @param quality - JPEG quality 0-1
 * @returns Array of compressed base64 data URLs
 */
export const compressImagesForPDF = async (
    imageUrls: string[],
    onProgress?: (percent: number) => void,
    maxWidth: number = 800,
    quality: number = 0.75
): Promise<string[]> => {
    const results: string[] = [];
    const total = imageUrls.length;
    
    for (let i = 0; i < total; i++) {
        const compressed = await compressImageForPDF(imageUrls[i], maxWidth, quality);
        results.push(compressed);
        
        if (onProgress) {
            onProgress(Math.round(((i + 1) / total) * 100));
        }
    }
    
    return results;
};

/**
 * Estimate the size of a base64 data URL in bytes
 */
export const estimateBase64Size = (dataUrl: string): number => {
    // Base64 encoded data is about 4/3 the size of binary
    const base64Data = dataUrl.split(',')[1] || '';
    return Math.round((base64Data.length * 3) / 4);
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
