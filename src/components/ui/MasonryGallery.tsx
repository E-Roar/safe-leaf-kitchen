import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";

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
  naturalWidth?: number;
  naturalHeight?: number;
}

export function MasonryGallery({ recipeId, recipeTitle, className }: MasonryGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate gallery images based on recipe
  useEffect(() => {
    const generateGalleryImages = async () => {
      setIsLoading(true);
      
      // Convert recipe title to folder format
      const folderName = recipeTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      
      // Common image variations - don't force aspect ratios, let images load naturally
      const imageVariations = [
        { name: 'ingredients' },
        { name: 'preparation' },
        { name: 'cooking' },
        { name: 'final' },
        { name: 'served' },
        { name: 'detail' },
        { name: 'close-up' },
        { name: 'plating' },
      ];
      
      // Create gallery images array with multiple formats
      const galleryImages: GalleryImage[] = [];
      
      // Try common image variations with PNG format only
      imageVariations.forEach(variation => {
        galleryImages.push({
          src: `/images/recipes/${folderName}/${variation.name}.png`,
          alt: `${recipeTitle} - ${variation.name}`,
          loaded: false,
        });
      });
      
      // Add some additional gallery images
      for (let i = 1; i <= 8; i++) {
        galleryImages.push({
          src: `/images/recipes/${folderName}/gallery-${i}.png`,
          alt: `${recipeTitle} - Gallery ${i}`,
          loaded: false,
        });
      }
      
      setImages(galleryImages);
      
      // Simulate loading delay for better UX
      setTimeout(() => setIsLoading(false), 300);
    };

    generateGalleryImages();
  }, [recipeId, recipeTitle]);

  const handleImageLoad = (index: number, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    setImages(prev => prev.map((image, i) => 
      i === index ? { 
        ...image, 
        loaded: true, 
        aspectRatio,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight 
      } : image
    ));
  };

  const handleImageError = (index: number) => {
    // Remove failed images from the gallery
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
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

  if (images.length === 0) {
    return null;
  }

  // Filter out only loaded images for display
  const loadedImages = images.filter(img => img.loaded);

  if (loadedImages.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Recipe Gallery</h4>
        <span className="text-sm text-muted-foreground">({loadedImages.length} photos)</span>
      </div>
      
      {/* Horizontal Responsive Masonry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loadedImages.map((image, index) => (
          <div
            key={image.src}
            className="group cursor-pointer"
          >
            <div 
              className="relative overflow-hidden rounded-lg bg-muted/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] w-full"
              style={{ aspectRatio: image.aspectRatio || 1 }}
            >
              {/* Remove loading placeholder since we only show loaded images */}
              
              <img
                src={image.src}
                alt={image.alt}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300",
                  "group-hover:scale-105"
                )}
                onLoad={(e) => handleImageLoad(index, e)}
                onError={() => handleImageError(index)}
                loading="lazy"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              
              {/* Image info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-white text-sm font-medium truncate">
                  {image.alt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Gallery Footer */}
      <div className="mt-6 p-4 glass rounded-xl text-center">
        <p className="text-sm text-muted-foreground">
          Images are dynamically loaded from the recipe's gallery folder
        </p>
      </div>
    </div>
  );
}