import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface MasonryGalleryProps {
  recipeId: number;
  recipeTitle: string;
  className?: string;
}

interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio?: number; // Make aspect ratio optional
  loaded: boolean;
  failed?: boolean; // Add failed state
  naturalWidth?: number;
  naturalHeight?: number;
}

export function MasonryGallery({ recipeId, recipeTitle, className }: MasonryGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Generate gallery images based on recipe
  useEffect(() => {
    const generateGalleryImages = async () => {
      setIsLoading(true);
      
      // Convert recipe title to folder format
      const folderName = recipeTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      
      // Limit to exactly 5 most common recipe image patterns
      const imageVariations = [
        { name: '1' },
        { name: '2' },
        { name: '3' },
        { name: '4' },
        { name: '5' }
      ];
      
      // Create gallery images array with exactly 5 images
      const galleryImages: GalleryImage[] = [];
      
      // Try numbered image variations with PNG format only
      imageVariations.forEach((variation, index) => {
        galleryImages.push({
          src: `/images/recipes/${folderName}/${variation.name}.png`,
          alt: `${recipeTitle} - Image ${index + 1}`,
          loaded: false,
        });
      });
      
      setImages(galleryImages);
      
      // Add a fallback timeout in case some images never trigger events
      setTimeout(() => {
        console.log('⏰ Recipe fallback timeout triggered - forcing loading complete');
        setIsLoading(false);
      }, 3000);
    };

    generateGalleryImages();
  }, [recipeId, recipeTitle]);

  // Start loading images as soon as they're available
  useEffect(() => {
    if (images.length > 0) {
      console.log(`🔄 Starting to load ${images.length} recipe images`);
      // The actual loading happens in the render when images are created
    }
  }, [images]);

  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    setImages(prev => {
      const newImages = prev.map((image, i) => 
        i === index ? { 
          ...image, 
          loaded: true, 
          aspectRatio,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight 
        } : image
      );
      
      // Check if all images have been attempted (loaded or failed)
      const allAttempted = newImages.every(img => img.loaded || img.failed);
      if (allAttempted) {
        setIsLoading(false);
      }
      
      return newImages;
    });
    
    console.log(`✅ Recipe image loaded successfully: ${img.src}`);
  };

  const handleImageError = (index: number, src: string) => {
    console.log(`❌ Recipe image failed to load: ${src}`);
    
    setImages(prev => {
      const newImages = prev.map((image, i) => 
        i === index ? { ...image, failed: true } : image
      );
      
      // Check if all images have been attempted (loaded or failed)
      const allAttempted = newImages.every(img => img.loaded || img.failed);
      if (allAttempted) {
        setIsLoading(false);
      }
      
      return newImages;
    });
  };

  const handleImageClick = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setLightboxOpen(true);
  };

  const handleLightboxNavigate = (newIndex: number) => {
    setLightboxIndex(newIndex);
  };

  const handleLightboxClose = () => {
    setLightboxOpen(false);
  };

  // Filter out only loaded images for display (exclude failed ones)
  const loadedImages = images.filter(img => img.loaded && !img.failed);
  const hasAttemptedLoading = images.some(img => img.loaded || img.failed);

  // Temporary debug logging
  console.log('Recipe Gallery state:', { 
    totalImages: images.length, 
    loadedImages: loadedImages.length, 
    hasAttemptedLoading,
    isLoading 
  });

  if (isLoading || (images.length > 0 && loadedImages.length === 0 && !hasAttemptedLoading)) {
    return (
      <div className={cn("w-full", className)}>
        {/* Hidden loading images - always present to trigger loading */}
        <div className="absolute left-[-9999px] top-0 opacity-0 pointer-events-none">
          {images.map((image, index) => (
            <img
              key={image.src}
              src={image.src}
              alt={image.alt}
              className="w-4 h-4"
              onLoad={(e) => handleImageLoad(index, e)}
              onError={() => handleImageError(index, image.src)}
              loading="eager"
              crossOrigin="anonymous"
            />
          ))}
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Recipe Gallery</h4>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Discovering images...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadedImages.length === 0) {
    // Don't show anything if no images loaded - this is normal
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden loading images - always present to trigger loading */}
      <div className="absolute left-[-9999px] top-0 opacity-0 pointer-events-none">
        {images.map((image, index) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            className="w-4 h-4"
            onLoad={(e) => handleImageLoad(index, e)}
            onError={() => handleImageError(index, image.src)}
            loading="eager"
            crossOrigin="anonymous"
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Recipe Gallery</h4>
        <span className="text-sm text-muted-foreground">({loadedImages.length} photos)</span>
      </div>
      
      {/* Horizontal Responsive Masonry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {loadedImages.map((image, index) => (
          <div
            key={image.src}
            className="group cursor-pointer"
            onClick={() => handleImageClick(index)}
          >
            <div 
              className="relative overflow-hidden rounded-xl bg-muted/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full min-h-[120px]"
              style={{ aspectRatio: image.aspectRatio && image.aspectRatio > 0.5 && image.aspectRatio < 2 ? image.aspectRatio : 1 }}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105 rounded-xl gallery-image"
                loading="lazy"
                crossOrigin="anonymous"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Lightbox */}
      <ImageLightbox
        images={loadedImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={handleLightboxClose}
        onNavigate={handleLightboxNavigate}
      />
      
      {/* Gallery Footer */}
      <div className="mt-6 p-4 glass rounded-xl text-center">
        <p className="text-sm text-muted-foreground">
          Images are dynamically loaded from the recipe's gallery folder
        </p>
      </div>
    </div>
  );
}
