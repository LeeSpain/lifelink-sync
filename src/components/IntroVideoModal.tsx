import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, ArrowLeft } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useVideoTracker } from '@/hooks/useVideoAnalytics';
import { VIDEO_CATALOG, Video } from '@/config/videos';

interface IntroVideoModalProps {
  trigger?: React.ReactNode;
  className?: string;
  defaultVideoId?: string;
}

export const IntroVideoModal = ({ trigger, className, defaultVideoId }: IntroVideoModalProps) => {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = React.useState<Video | null>(null);
  const { trackVideoEvent } = useVideoTracker();
  const playerRef = React.useRef<any>(null);
  const playStartRef = React.useRef<number | null>(null);

  const videos = VIDEO_CATALOG;

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className={className}>
      <Play className="h-4 w-4 mr-2" />
      {t('nav.introVideo', 'Intro Video')}
    </Button>
  );

  const handleVideoSelect = React.useCallback((video: Video) => {
    if (video.available) {
      setSelectedVideo(video);
      // Track video click event
      trackVideoEvent(video.id, video.title, 'click');
    }
  }, [trackVideoEvent]);

  const handleBack = () => {
    setSelectedVideo(null);
  };

  const handleClose = () => {
    setSelectedVideo(null);
  };

  // Auto-select video when modal opens if defaultVideoId is provided
  React.useEffect(() => {
    if (defaultVideoId) {
      const video = videos.find(v => v.id === defaultVideoId);
      if (video && video.available) {
        setSelectedVideo(video);
      }
    }
  }, [defaultVideoId, videos]);

  // Setup YouTube Iframe API and track detailed events
  React.useEffect(() => {
    if (!selectedVideo) return;
    let canceled = false;

    const ensureYouTubeAPI = () => new Promise<void>((resolve) => {
      const w = window as any;
      if (w.YT && w.YT.Player) return resolve();
      const existing = document.getElementById('youtube-iframe-api');
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      (window as any).onYouTubeIframeAPIReady = () => resolve();
    });

    const setupPlayer = async () => {
      try {
        await ensureYouTubeAPI();
        if (canceled) return;
        const YT = (window as any).YT;
        playerRef.current = new YT.Player(`youtube-player-${selectedVideo.id}`, {
          events: {
            onStateChange: (e: any) => {
              const state = e.data;
              const player = e.target;
              const pos = Math.floor(player?.getCurrentTime?.() || 0);
              const dur = Math.floor(player?.getDuration?.() || 0);

              if (state === YT.PlayerState.PLAYING) {
                if (playStartRef.current === null) {
                  playStartRef.current = pos;
                  trackVideoEvent(selectedVideo.id, selectedVideo.title, 'play', { totalDuration: dur, videoPosition: pos });
                }
              } else if (state === YT.PlayerState.PAUSED) {
                if (playStartRef.current !== null) {
                  const watched = Math.max(0, pos - playStartRef.current);
                  trackVideoEvent(selectedVideo.id, selectedVideo.title, 'pause', { watchDuration: watched, videoPosition: pos, totalDuration: dur });
                  playStartRef.current = null;
                }
              } else if (state === YT.PlayerState.ENDED) {
                const start = playStartRef.current ?? 0;
                const watched = Math.max(0, dur - start);
                trackVideoEvent(selectedVideo.id, selectedVideo.title, 'ended', { watchDuration: watched, videoPosition: dur, totalDuration: dur });
                playStartRef.current = null;
              }
            }
          }
        });
      } catch (err) {
        console.warn('YouTube Player setup failed:', err);
      }
    };

    setupPlayer();

    return () => {
      canceled = true;
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
      playStartRef.current = null;
    };
  }, [selectedVideo, trackVideoEvent]);

  return (
    <Dialog onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto p-0 bg-gradient-to-br from-background via-background/95 to-muted/30 border border-border/50 shadow-2xl backdrop-blur-sm">
        <DialogHeader className="absolute top-4 right-4 z-20">
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-background/90 backdrop-blur-md rounded-full h-10 w-10 p-0 shadow-lg border border-border/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTrigger>
        </DialogHeader>

        {selectedVideo && selectedVideo.available ? (
          <>
            <DialogHeader className="absolute top-4 left-4 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hover:bg-background/90 backdrop-blur-md rounded-full h-10 w-10 p-0 shadow-lg border border-border/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </DialogHeader>
            
            <div className="flex justify-center px-6 pt-6">
              <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  id={`youtube-player-${selectedVideo.id}`}
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`}
                  title={selectedVideo.title}
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => {
                    // Analytics tag (non-persistent)
                    if (typeof window !== 'undefined' && window.gtag && selectedVideo) {
                      window.gtag('event', 'video_iframe_loaded', {
                        video_title: selectedVideo.title,
                        video_id: selectedVideo.id,
                        video_provider: 'youtube'
                      });
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="px-6 py-4 max-w-2xl mx-auto bg-gradient-to-br from-background to-muted/5">
              <DialogTitle className="text-lg font-semibold mb-2 text-center text-foreground">
                {selectedVideo.title}
              </DialogTitle>
              <p className="text-muted-foreground text-sm leading-relaxed text-center">
                {selectedVideo.description}
              </p>
            </div>
          </>
        ) : (
          <div className="p-6 md:p-8">
            <DialogHeader className="mb-8 text-center">
              <DialogTitle className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                {t('introVideo.title', 'LifeLink Sync Introduction Videos')}
              </DialogTitle>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                {t('introVideo.description', 'Choose a video to learn more about LifeLink Sync')}
              </p>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`group cursor-pointer border border-border/50 rounded-lg overflow-hidden transition-all duration-300 bg-gradient-to-br from-card via-card/95 to-muted/10 backdrop-blur-sm shadow-md ${
                    video.available 
                      ? 'hover:shadow-xl hover:scale-[1.02] hover:border-primary/40 hover:shadow-primary/10' 
                      : 'opacity-70 cursor-not-allowed'
                  }`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
                    {video.available && video.youtubeId ? (
                      <>
                        <img
                          src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = `https://img.youtube.com/vi/${video.youtubeId}/default.jpg`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                        <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-3 group-hover:bg-black/70 group-hover:scale-110 transition-all duration-300 shadow-xl">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gradient-to-br from-muted/40 to-muted/60 backdrop-blur-sm rounded-full p-4">
                            <Play className="h-6 w-6 text-muted-foreground/70" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors duration-200 leading-tight">
                      {video.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                      {video.description}
                    </p>
                    {!video.available && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-muted/50 to-muted/70 border border-border/30">
                        <p className="text-xs text-muted-foreground font-medium">Coming Soon</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground/80 max-w-xl mx-auto">
                More comprehensive video tutorials will be added soon to help you master every aspect of LifeLink Sync
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IntroVideoModal;