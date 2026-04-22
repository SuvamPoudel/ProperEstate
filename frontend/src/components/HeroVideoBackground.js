import React, { useEffect, useRef, useState, useMemo } from 'react';

/**
 * HeroVideoBackground Component
 * 
 * Uses a local video file from public/videos/ as the hero background.
 * Falls back to a Ken Burns image slideshow if the video fails to load.
 */
const HeroVideoBackground = () => {
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fallback city images (only used if video fails)
  const fallbackImages = useMemo(() => [
    'https://images.unsplash.com/photo-1558799401-1dcba79834c2?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1565073182887-6bcefbe225b1?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1585825316418-49fb304e760c?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1596767690623-28f9d020d182?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1609920658906-8223bd289001?auto=format&fit=crop&w=1920&q=80',
  ], []);

  // Fallback image cycling
  useEffect(() => {
    if (!videoFailed) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % fallbackImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [videoFailed, fallbackImages.length]);

  // Preload fallback images
  useEffect(() => {
    fallbackImages.forEach((src) => { const img = new Image(); img.src = src; });
  }, [fallbackImages]);

  return (
    <>
      <div className="hero-video-container" style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        backgroundColor: '#0a0e1a'
      }}>

        {/* PRIMARY: Local video from public/videos/ */}
        {!videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onError={() => setVideoFailed(true)}
            onStalled={() => setTimeout(() => {
              if (videoRef.current && videoRef.current.readyState < 2) setVideoFailed(true);
            }, 3000)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            {/* Local video from public/videos/ */}
            <source src={encodeURI("/videos/Kathmandu City From Above 🇳🇵  A Cinematic Drone Journey.mp4")} type="video/mp4" />
            <source src="/videos/hero-bg.webm" type="video/webm" />
          </video>
        )}

        {/* FALLBACK: Image slideshow if video is missing */}
        {videoFailed && fallbackImages.map((src, idx) => (
          <div
            key={idx}
            className={`drone-slide ${idx === currentIndex ? 'active' : ''}`}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === currentIndex ? 1 : 0,
              transition: 'opacity 1.2s ease-in-out',
            }}
          />
        ))}

        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,14,26,0.25) 0%, rgba(10,14,26,0.35) 45%, rgba(10,14,26,0.85) 100%)'
        }} />
      </div>
      
      {/* Scroll Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{
          fontSize: '11px',
          letterSpacing: '0.12em',
          color: 'rgba(240,237,232,0.5)',
          textTransform: 'uppercase',
          fontFamily: 'monospace'
        }}>scroll</span>
        <div style={{
          width: '1px',
          height: '40px',
          background: 'linear-gradient(to bottom, rgba(240,237,232,0.5), transparent)',
          animation: 'scrollPulse 1.8s ease-in-out infinite'
        }} />
      </div>
      
      <style>{`
        .drone-slide {
          transform: scale(1.0);
        }
        .drone-slide.active {
          animation: kenBurnsDrone 6s ease-out forwards;
        }
        @keyframes kenBurnsDrone {
          0%   { transform: scale(1.0) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1%, -1.5%); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.15); }
        }
      `}</style>
    </>
  );
};

export default HeroVideoBackground;
