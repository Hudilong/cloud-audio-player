import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Audio } from '@prisma/client';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import AudioCard from './AudioCard';

interface AudioCarouselProps {
  tracks: Audio[];
  onSelect: (track: Audio) => void;
}

export default function AudioCarousel({
  tracks,
  onSelect,
}: AudioCarouselProps) {
  return (
    <Swiper
      modules={[Navigation, Pagination]}
      spaceBetween={1}
      slidesPerView={1}
      navigation
      pagination={{ clickable: true }}
      breakpoints={{
        640: {
          slidesPerView: 2.5,
        },
        768: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 6,
        },
        1280: {
          slidesPerView: 8,
        },
      }}
    >
      {tracks.map((track) => (
        <SwiperSlide key={track.id}>
          <AudioCard track={track} onSelect={onSelect} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
