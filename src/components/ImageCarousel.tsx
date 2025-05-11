import { useState } from 'react';
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
        lazy={{
          loadPrevNext: true,
          loadPrevNextAmount: 2
        }}
        zoom={{
          maxRatio: 2,
          toggle: true
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        className="rounded-lg overflow-hidden"
      >
        {mockups.map((mockup, index) => (
          <SwiperSlide key={mockup.id} className="bg-gray-100">
            <div className="swiper-zoom-container">
              <img
                data-src={mockup.mockup_path}
                alt={`Design mockup ${index + 1}`}
                className="swiper-lazy w-full h-[500px] object-contain cursor-zoom-in"
              />
              <div className="swiper-lazy-preloader swiper-lazy-preloader-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {index + 1} of {mockups.length}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
        {activeIndex + 1} / {mockups.length}
      </div>
    </div>
  );
}