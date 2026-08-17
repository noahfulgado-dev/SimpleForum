import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music4, Pause, Play, Radio } from 'lucide-react';
import { Waveform } from '../decor';
import { spotifyAPI } from '@/services/api';
import axiosInstance from '@/services/axios';

const FALLBACK = {
  title: 'slow mornings',
  artist: 'huni radio',
  genre: 'lo-fi',
  time: '01:24',
  total: '03:12',
} as const;

const CONNECT_URL = `${(axiosInstance.defaults.baseURL ?? '').replace(/\/$/, '')}/accounts/spotify/login/?process=connect`;

function fmt(ms: number): string {
  if (!ms || ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function NowPlayingCard({ className = '' }: { className?: string }) {
  const [tick, setTick] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['spotify', 'now-playing'],
    queryFn: () => spotifyAPI.getNowPlaying().then(r => r.data),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 15000,
  });

  const playing = data?.connected === true && data?.playing === true;
  const is_playing = playing && data?.is_playing !== false;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [playing, data?.title, data?.progress_ms]);

  useEffect(() => {
    setPreviewing(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [data?.title]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const elapsed = playing ? (data?.progress_ms ?? 0) + (is_playing ? tick * 1000 : 0) : 0;
  const pct = playing && data?.duration_ms ? Math.min(100, (elapsed / data.duration_ms) * 100) : 0;

  const togglePreview = () => {
    if (!data?.preview_url) return;
    if (previewing) {
      audioRef.current?.pause();
      setPreviewing(false);
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(data.preview_url);
      audioRef.current.onended = () => setPreviewing(false);
    }
    audioRef.current.play();
    setPreviewing(true);
  };

  if (!isLoading && data?.connected === false) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#1db954,#121212)]">
            <Radio className="h-7 w-7 text-white/90" strokeWidth={1.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-unna text-base font-bold italic text-foreground">Your Spotify</p>
            <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              connect to show what you're playing
            </p>
          </div>
        </div>
        <a
          href={CONNECT_URL}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          <Radio className="h-3.5 w-3.5" strokeWidth={2} />
          Connect Spotify
        </a>
      </div>
    );
  }

  if (!isLoading && data?.connected === true && !data.playing) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#1db954,#121212)]">
            <Radio className="h-7 w-7 text-white/90" strokeWidth={1.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-unna text-base font-bold italic text-foreground">Nothing playing</p>
            <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              play something on Spotify and it shows up here
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
            {data?.album_art ? (
              <img src={data.album_art} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music4 className="h-7 w-7 text-white/90" strokeWidth={1.25} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-unna text-base font-bold italic text-foreground">{data?.title}</p>
            <p className="mt-0.5 truncate font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              {(data?.artists ?? []).join(', ')} · {data?.device ?? 'spotify'}
            </p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {is_playing ? (
              <Pause className="h-4 w-4 fill-current" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
            )}
          </span>
        </div>
        <Waveform
          className="mt-3 h-4"
          bars={[30, 50, 40, 70, 55]}
          pulse={is_playing}
          duration={1.6}
          color="rgb(158 193 163 / 0.8)"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
            {fmt(elapsed)}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
            {fmt(data?.duration_ms ?? 0)}
          </span>
        </div>
        {data?.preview_url && (
          <button
            onClick={togglePreview}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20 cursor-pointer"
          >
            {previewing ? <Pause className="h-3.5 w-3.5 fill-current" strokeWidth={0} /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" strokeWidth={0} />}
            {previewing ? 'Pause preview' : 'Play 30s preview'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
          <Music4 className="h-7 w-7 text-white/90" strokeWidth={1.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-unna text-base font-bold italic text-foreground">{FALLBACK.title}</p>
          <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
            {FALLBACK.genre} · now playing
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
        </span>
      </div>
      <Waveform
        className="mt-3 h-4"
        bars={[30, 50, 40, 70, 55]}
        pulse
        duration={1.6}
        color="rgb(158 193 163 / 0.8)"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
          {FALLBACK.time}
        </span>
        <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
          {FALLBACK.total}
        </span>
      </div>
    </div>
  );
}

export default NowPlayingCard;