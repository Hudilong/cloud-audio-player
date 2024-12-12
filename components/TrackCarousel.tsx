import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { Track } from '@prisma/client';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import TrackCard from './TrackCard';

interface TrackCarouselProps {
  tracks: Track[];
  onSelect: (track: Track) => void;
  onDelete: (track: Track) => void;
}

export default function TrackCarousel({
  tracks,
  onSelect,
  onDelete,
}: TrackCarouselProps) {
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
          <TrackCard track={track} onSelect={onSelect} onDelete={onDelete} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
