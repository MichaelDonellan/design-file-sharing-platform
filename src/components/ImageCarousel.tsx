import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';

interface ImageCarouselProps {
  images: string[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    console.log('Images received:', images);
  }, [images]);

  const handleImageLoad = (imageIndex: number) => {
    console.log(`Image loaded successfully: ${imageIndex}`);
    setLoadedImages(prev => ({
      ...prev,
      [imageIndex]: true
    }));
  };

  const handleImageError = (imageIndex: number, error: any) => {
    console.error(`Failed to load image ${imageIndex}:`, error);
    setLoadedImages(prev => ({
      ...prev,
      [imageIndex]: true // Mark as loaded even on error to remove loading state
    }));
  };

  return (
    <div className="relative group">
      <Swiper
        modules={[Navigation, Pagination, Zoom]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ 
          clickable: true,
          dynamicBullets: true
        }}
        zoom={{
          maxRatio: 2,
          toggle: true
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        className="rounded-lg overflow-hidden"
      >
        {images.map((imageUrl, index) => {
          console.log(`Rendering image ${index + 1}:`, imageUrl);
          return (
          <SwiperSlide key={index} className="bg-gray-100">
              <div className="swiper-zoom-container relative">
                {!loadedImages[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                )}
              <img
                  src={imageUrl}
                  alt={`Design image ${index + 1}`}
                  className={`w-full h-[500px] object-contain cursor-zoom-in transition-opacity duration-300 ${
                    loadedImages[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(index)}
                  onError={(e) => handleImageError(index, e)}
                />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1} of {images.length}
            </div>
          </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        {activeIndex + 1} / {images.length}
      </div>
    </div>
  );
}