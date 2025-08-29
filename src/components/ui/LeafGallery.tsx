import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Leaf } from "lucide-react";

interface LeafGalleryProps {
  leafId: number;
  leafName: string;
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

export function LeafGallery({ leafId, leafName, className }: LeafGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Generate gallery images based on leaf - Dynamic discovery approach
  useEffect(() => {
    const generateGalleryImages = async () => {
      setIsLoading(true);
      
      // Convert leaf name to folder format (fixed regex)
      const folderName = leafName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      
      // Since we can't dynamically list files from the browser, we'll try a comprehensive list
      // of possible image names that users might upload
      const possibleImageNames = [
        // Your actual uploaded files for onion leaves
        'General-view-Welch-onion-plant-with-foliage-leaves-and-long-pseudostemSource',
        'IMG-20191003-134515',
        'Onion_Green_Leaves_Seeds_Open_Pollination', 
        'Onion_leaves',
        'The-onion-is-grown-on-the-soil-in-the-plots',
        'slk (10)',
        'the-vibrant-bundle-of-fresh-green-onions-ready-for-culinary-use-photo',
        
        // Common descriptive names
        'whole-plant', 'leaf-detail', 'texture-close-up', 'fresh-leaves', 'dried-leaves',
        'cross-section', 'surface-detail', 'veins-pattern', 'growth-stages', 'nutrition-prep',
        'cooking-ready', 'microscopic', 'botanical-detail', 'plant-structure', 'leaf-texture',
        
        // Generic numbered patterns
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        'image1', 'image2', 'image3', 'image4', 'image5',
        'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4', 'gallery-5',
        'photo1', 'photo2', 'photo3', 'photo4', 'photo5',
        
        // Common file naming patterns
        leafName.toLowerCase().replace(/\s+/g, '_'),
        leafName.toLowerCase().replace(/\s+/g, '-'),
        leafName.toLowerCase().replace(/\s+/g, ''),
        
        // Additional patterns users might use
        'main', 'primary', 'hero', 'cover', 'thumbnail',
        'close-up', 'macro', 'detail', 'overview', 'full-plant'
      ];
      
      // Create gallery images array
      const galleryImages: GalleryImage[] = [];
      
      // Test each possible image name
      possibleImageNames.forEach((imageName, index) => {
        galleryImages.push({
          src: `/images/leaves/${folderName}/${imageName}.png`,
          alt: `${leafName} - ${imageName.replace(/[-_]/g, ' ')}`,
          loaded: false,
        });
      });
      
      setImages(galleryImages);
      
      // Shorter loading delay since we're testing multiple images
      setTimeout(() => setIsLoading(false), 200);
    };

    generateGalleryImages();
  }, [leafId, leafName]);

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
          <h4 className="font-semibold text-foreground">Leaf Gallery</h4>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm">Discovering botanical images...</span>
          </div>
        </div>
      </div>
    );
  }

  // Filter out only loaded images for display
  const loadedImages = images.filter(img => img.loaded);

  if (loadedImages.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Leaf Gallery</h4>
        </div>
        <div className="p-6 glass rounded-xl text-center">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            No images found in the gallery folder
          </p>
          <p className="text-xs text-muted-foreground">
            Expected folder: <code className="bg-muted/50 px-1 rounded">/images/leaves/{leafName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}/</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">Leaf Gallery</h4>
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
          Botanical images dynamically loaded from the leaf's gallery folder
        </p>
      </div>
    </div>
  );
}