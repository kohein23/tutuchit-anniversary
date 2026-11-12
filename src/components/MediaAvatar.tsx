import React, { useState, useEffect, useRef } from 'react';
import { isVideoSource } from '../utils/cmsHelpers';

interface MediaAvatarProps {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  className?: string;
}

export function MediaAvatar({
  src,
  fallbackSrc = '/kko.jpg',
  alt = 'Avatar',
  className = 'w-full h-full object-cover',
}: MediaAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const activeSrc = (!hasError && src) ? src : fallbackSrc;
  const isVideo = isVideoSource(activeSrc);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay policy handled silently
      });
    }
  }, [isVideo, activeSrc]);

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        key={activeSrc}
        src={activeSrc}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <img
      key={activeSrc}
      src={activeSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
}
