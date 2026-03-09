import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useVideoTracker } from '@/hooks/useVideoAnalytics';
import { VIDEO_CATALOG, Video } from '@/config/videos';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { PageSEO } from '@/components/PageSEO';

const VideoPlayer = ({ video, onBack }: { video: Video; onBack: () => void }) => {
  const { trackVideoEvent } = useVideoTracker();
  const playerRef = useRef<any>(null);
  const playStartRef = useRef<number | null>(null);

  // Setup YouTube Iframe API and track detailed events
  useEffect(() => {
    if (!video) return;
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
        playerRef.current = new YT.Player(`youtube-player-${video.id}`, {
          events: {
            onStateChange: (e: any) => {
              const state = e.data;
              const player = e.target;
              const pos = Math.floor(player?.getCurrentTime?.() || 0);
              const dur = Math.floor(player?.getDuration?.() || 0);

              if (state === YT.PlayerState.PLAYING) {
                if (playStartRef.current === null) {
                  playStartRef.current = pos;
                  trackVideoEvent(video.id, video.title, 'play', { totalDuration: dur, videoPosition: pos });
                }
              } else if (state === YT.PlayerState.PAUSED) {
                if (playStartRef.current !== null) {
                  const watched = Math.max(0, pos - playStartRef.current);
                  trackVideoEvent(video.id, video.title, 'pause', { watchDuration: watched, videoPosition: pos, totalDuration: dur });
                  playStartRef.current = null;
                }
              } else if (state === YT.PlayerState.ENDED) {
                const start = playStartRef.current ?? 0;
                const watched = Math.max(0, dur - start);
                trackVideoEvent(video.id, video.title, 'ended', { watchDuration: watched, videoPosition: dur, totalDuration: dur });
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
  }, [video, trackVideoEvent]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 hover:bg-background/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videos
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl mb-6" style={{ paddingBottom: '56.25%' }}>
            <iframe
              id={`youtube-player-${video.id}`}
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`}
              title={video.title}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-border/50">
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              {video.title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {video.description}
            </p>
            {video.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Videos = () => {
  const { t } = useTranslation();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { trackVideoEvent } = useVideoTracker();

  const handleVideoSelect = useCallback((video: Video) => {
    if (video.available) {
      setSelectedVideo(video);
      // Track video click event
      trackVideoEvent(video.id, video.title, 'click');
    }
  }, [trackVideoEvent]);

  const handleBack = () => {
    setSelectedVideo(null);
  };

  if (selectedVideo) {
    return <VideoPlayer video={selectedVideo} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen">
      <PageSEO 
        pageType="videos"
        customTitle="LifeLink Sync Video Library"
        customDescription="Watch our comprehensive video library to learn about LifeLink Sync features, capabilities, and how we protect families of all ages."
      />
      
      <Navigation />
      
      <div className="container mx-auto px-4 py-section">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
            LifeLink Sync Video Library
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Discover how LifeLink Sync protects families through our comprehensive video collection. 
            Learn about features, meet our AI assistant Clara, and see our global protection network in action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {VIDEO_CATALOG.map((video) => (
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
                      <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 group-hover:bg-black/70 group-hover:scale-110 transition-all duration-300 shadow-xl">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-muted/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gradient-to-br from-muted/40 to-muted/60 backdrop-blur-sm rounded-full p-4">
                        <Play className="h-8 w-8 text-muted-foreground/70" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors duration-200 leading-tight">
                  {video.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {video.description}
                </p>
                
                {video.tags && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {video.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {!video.available && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-muted/50 to-muted/70 border border-border/30">
                    <p className="text-xs text-muted-foreground font-medium">Coming Soon</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-3 text-foreground">
              More Videos Coming Soon
            </h2>
            <p className="text-muted-foreground">
              We're continuously adding new video content to help you master every aspect of LifeLink Sync. 
              Stay tuned for tutorials on advanced features, setup guides, and customer success stories.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Videos;