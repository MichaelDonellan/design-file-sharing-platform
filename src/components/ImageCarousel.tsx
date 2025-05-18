import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import type { DesignMockup } from '../types';

interface ImageCarouselProps {
  mockups: DesignMockup[];
}

export default function ImageCarousel({ mockups }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    console.log('Mockups received:', mockups);
  }, [mockups]);

  const handleImageLoad = (mockupId: string) => {
    console.log(`Image loaded successfully for mockup ${mockupId}`);
    setLoadedImages(prev => ({
      ...prev,
      [mockupId]: true
    }));
  };

  const handleImageError = (mockupId: string, error: any) => {
    console.error(`Failed to load image for mockup ${mockupId}:`, error);
    setLoadedImages(prev => ({
      ...prev,
      [mockupId]: true // Mark as loaded even on error to remove loading state
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
        {mockups.map((mockup, index) => {
          console.log(`Rendering mockup ${index + 1}:`, mockup);
          return (
          <SwiperSlide key={mockup.id} className="bg-gray-100">
              <div className="swiper-zoom-container relative">
                {!loadedImages[mockup.id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                )}
              <img
                  src={mockup.mockup_path}
                alt={`Design mockup ${index + 1}`}
                  className={`w-full h-[500px] object-contain cursor-zoom-in transition-opacity duration-300 ${
                    loadedImages[mockup.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(mockup.id)}
                  onError={(e) => handleImageError(mockup.id, e)}
                />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1} of {mockups.length}
            </div>
          </SwiperSlide>
          );
        })}
      </Swiper>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        {activeIndex + 1} / {mockups.length}
      </div>
    </div>
  );
}