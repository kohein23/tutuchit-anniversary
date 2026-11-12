import { useState, useEffect, useRef } from 'react';
import { Music } from 'lucide-react';
import { motion } from 'motion/react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { resolveAudioUrl } from '../utils/audioUpload';

export interface MusicConfig {
  type?: 'youtube' | 'mp3';
  youtubeVideoId?: string;
  audioUrl?: string;
  audioName?: string;
}

interface MusicPlayerProps {
  showUI?: boolean;
  music?: MusicConfig;
  videoId?: string;
}

export function MusicPlayer({
  showUI = true,
  music,
  videoId = 'U_2b0tVwXnQ'
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const playerRef = useRef<any>(null); // YouTube player ref
  const audioRef = useRef<HTMLAudioElement | null>(null); // HTML5 Audio ref

  const isMp3 = music?.type === 'mp3' || (!music?.type && Boolean(music?.audioUrl));
  const audioUrl = music?.audioUrl || '';
  const ytVideoId = music?.youtubeVideoId || videoId || 'U_2b0tVwXnQ';
  const [resolvedAudioSrc, setResolvedAudioSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (!audioUrl) {
      setResolvedAudioSrc('');
      return;
    }
    resolveAudioUrl(audioUrl).then((src) => {
      if (active) setResolvedAudioSrc(src);
    }).catch(() => {
      if (active) setResolvedAudioSrc(audioUrl);
    });
    return () => { active = false; };
  }, [audioUrl]);

  // Dispatch state change so SurprisePage can update its "ဖွင့်မယ် / ပိတ်မယ်" button
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('music-state-change', { detail: { isPlaying } }));
  }, [isPlaying]);

  // YouTube Callbacks
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(50);
    // If user already interacted before player became ready, start playback
    if (hasInteracted && !isMp3) {
      playerRef.current.playVideo();
    }
  };

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1: PLAYING, 2: PAUSED, 0: ENDED
    if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) {
      setIsPlaying(false);
    }
  };

  // Play / Pause actions
  const playActiveMusic = () => {
    setHasInteracted(true);
    if (isMp3) {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Audio autoplay prevented by browser:', err);
        });
      }
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.playVideo();
        } catch (e) {
          console.warn('YouTube playVideo error:', e);
        }
      }
    }
  };

  const pauseActiveMusic = () => {
    if (isMp3) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn('YouTube pauseVideo error:', e);
        }
        setIsPlaying(false);
      }
    }
  };

  const toggleActiveMusic = () => {
    setHasInteracted(true);
    if (isMp3) {
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(console.warn);
        }
      }
    } else {
      if (playerRef.current) {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      }
    }
  };

  // Global window event listeners
  useEffect(() => {
    const handlePlayMusic = () => {
      playActiveMusic();
    };

    const handleToggleMusic = () => {
      toggleActiveMusic();
    };

    window.addEventListener('play-music', handlePlayMusic);
    window.addEventListener('toggle-music', handleToggleMusic);

    return () => {
      window.removeEventListener('play-music', handlePlayMusic);
      window.removeEventListener('toggle-music', handleToggleMusic);
    };
  }, [isMp3, isPlaying, audioUrl, ytVideoId]);

  // When user opens the site and showUI becomes true (intro screen clicked), begin playing
  useEffect(() => {
    if (showUI) {
      playActiveMusic();
    }
  }, [showUI]);

  // Ensure volume is comfortable for HTML5 audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.6;
    }
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    toggleActiveMusic();
  };

  const opts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      loop: 1,
      playlist: ytVideoId,
    },
  };

  const trackLabel = music?.audioName || (isMp3 ? 'MP3 Audio' : 'YouTube Music');

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 ${(!showUI || !hasInteracted) ? 'hidden' : ''}`}>
      {/* MP3 HTML5 Audio Element */}
      {isMp3 && (resolvedAudioSrc || audioUrl) && (
        <audio
          ref={audioRef}
          src={resolvedAudioSrc || audioUrl}
          loop
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.warn('Audio playback error on source:', resolvedAudioSrc || audioUrl, e);
            setIsPlaying(false);
          }}
        />
      )}

      {/* YouTube Player Element */}
      {!isMp3 && ytVideoId && (
        <div className="hidden">
          <YouTube
            videoId={ytVideoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={(e) => {
              console.warn('YouTube error handled:', e);
              setIsPlaying(false);
            }}
          />
        </div>
      )}

      {/* Floating Music Control Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlay}
        onTouchStart={(e) => e.stopPropagation()}
        title={trackLabel}
        className="bg-white/80 backdrop-blur-xl p-3 sm:px-4 rounded-full shadow-[0_8px_32px_0_rgba(255,182,193,0.4)] border border-white/60 text-pink-500 hover:text-pink-600 transition-all flex items-center justify-center sm:gap-3 hover:bg-white/95"
      >
        <div className="flex items-center gap-1 h-6">
          {isPlaying ? (
            <>
              <motion.div
                animate={{ height: [8, 16, 8] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-1 bg-pink-400 rounded-full"
              />
              <motion.div
                animate={{ height: [12, 24, 12] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-1 bg-pink-400 rounded-full"
              />
              <motion.div
                animate={{ height: [8, 16, 8] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1 bg-pink-400 rounded-full"
              />
            </>
          ) : (
            <Music size={18} className="text-pink-400" />
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {isPlaying ? 'Playing' : 'Play Music'}
        </span>
      </motion.button>
    </div>
  );
}
