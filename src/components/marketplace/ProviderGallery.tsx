// ============================================================
// Húsfélagið.is — ProviderGallery
// Image gallery grid for provider portfolio
// ============================================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { PortfolioImage } from '@/hooks/useProviderPortfolio';

interface ProviderGalleryProps {
  images: PortfolioImage[];
}

export function ProviderGallery({ images }: ProviderGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((img) => (
          <button
            key={img.id}
            onClick={() => setSelectedImage(img)}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden border bg-muted/30 hover:shadow-md transition-shadow"
          >
            <img
              src={img.image_url}
              alt={img.caption ?? 'Verkefnamynd'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6">
                <p className="text-[11px] text-white/90 line-clamp-1">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.caption ?? 'Verkefnamynd'}
                className="w-full max-h-[80vh] object-contain"
              />
              {selectedImage.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                  <p className="text-sm text-white">{selectedImage.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
