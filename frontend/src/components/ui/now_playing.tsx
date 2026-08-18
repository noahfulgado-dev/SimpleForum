import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Music4, Pause, Play, Radio, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Waveform } from '../decor';
import { spotifyAPI } from '@/services/api';
import type { NowPlaying } from '@/services/api';
import { PENDING_SPOTIFY_KEY, getSpotifyConnectUrl } from '@/services/axios';
import { useAuth } from '@/context/AuthContext';

const FALLBACK = {
  title: 'slow mornings',
  artist: 'huni radio',
  genre: 'lo-fi',
  time: '01:24',
  total: '03:12',
} as const;

const CONTROL_ERRORS: Record<string, string> = {
  not_connected: 'Connect Spotify first.',
  premium_required: 'Spotify Premium required for controls.',
  reconnect_required: 'Reconnect Spotify to unlock controls.',
  no_device: 'Nothing playing on Spotify — start something on any device.',
  player_command_failed: 'Spotify rejected the command.',
};

function fmt(ms: number): string {
  if (!ms || ms <= 0) return '00:00';
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const NOW_PLAYING_KEY = ['spotify', 'now-playing'];

export function NowPlayingCard({ className = '' }: { className?: string }) {
  const [tick, setTick] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [volume, setVolume] = useState(100);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleConnect = () => {
    if (isAuthenticated) {
      window.location.href = getSpotifyConnectUrl();
    } else {
      localStorage.setItem(PENDING_SPOTIFY_KEY, '1');
      navigate('/login');
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: NOW_PLAYING_KEY,
    queryFn: () => spotifyAPI.getNowPlaying().then(r => r.data),
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 15000,
  });

  const playing = data?.connected === true && data?.playing === true;
  const is_playing = playing && data?.is_playing !== false;
  const premium = data?.premium !== false;

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

  useEffect(() => () => {
    audioRef.current?.pause();
    if (volumeTimer.current) clearTimeout(volumeTimer.current);
  }, []);

  const elapsed = playing ? (data?.progress_ms ?? 0) + (is_playing ? tick * 1000 : 0) : 0;
  const pct = playing && data?.duration_ms ? Math.min(100, (elapsed / data.duration_ms) * 100) : 0;

  const patch = (partial: Partial<NowPlaying>) => {
    queryClient.setQueryData<NowPlaying>(NOW_PLAYING_KEY, old =>
      old ? { ...old, ...partial } : old,
    );
  };

  const runControl = async (cmd: Parameters<typeof spotifyAPI.control>[0], optimistic?: Partial<NowPlaying>) => {
    if (busy) return;
    setBusy(true);
    if (optimistic) patch(optimistic);
    try {
      await spotifyAPI.control(cmd);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { code?: string } } };
      const code = axiosErr.response?.data?.code;
      toast.error(CONTROL_ERRORS[code ?? ''] ?? 'Could not control Spotify.');
      if (optimistic) refetch();
    } finally {
      setBusy(false);
      refetch();
    }
  };

  const togglePlay = () =>
    runControl(is_playing ? { action: 'pause' } : { action: 'play' }, {
      is_playing: !is_playing,
    });

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const position_ms = Math.round((data?.duration_ms ?? 0) * ratio);
    if (!data?.duration_ms) return;
    runControl({ action: 'seek', position_ms }, { progress_ms: position_ms });
  };

  const handleVolume = (value: number) => {
    setVolume(value);
    if (volumeTimer.current) clearTimeout(volumeTimer.current);
    volumeTimer.current = setTimeout(() => {
      runControl({ action: 'volume', volume_percent: value });
    }, 350);
  };

  const toggleShuffle = () =>
    runControl({ action: 'shuffle', state: !data?.shuffle }, { shuffle: !data?.shuffle });

  const cycleRepeat = () => {
    const order = ['off', 'context', 'track'] as const;
    const current = data?.repeat ?? 'off';
    const next = order[(order.indexOf(current) + 1) % order.length];
    runControl({ action: 'repeat', state: next }, { repeat: next });
  };

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

  const RepeatIcon = data?.repeat === 'track' ? Repeat1 : Repeat;

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
        <button
          onClick={handleConnect}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          <Radio className="h-3.5 w-3.5" strokeWidth={2} />
          Connect Spotify
        </button>
      </div>
    );
  }

  if (!isLoading && !data && error) {
    return (
      <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#1db954,#121212)]">
            <Radio className="h-7 w-7 text-white/90" strokeWidth={1.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-unna text-base font-bold italic text-foreground">Spotify hiccup</p>
            <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              couldn't reach Spotify — retrying
            </p>
          </div>
        </div>
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
          {premium ? (
            <button
              onClick={togglePlay}
              disabled={busy}
              aria-label={is_playing ? 'Pause' : 'Play'}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-60"
            >
              {is_playing ? (
                <Pause className="h-4 w-4 fill-current" strokeWidth={0} />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
              )}
            </button>
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {is_playing ? (
                <Pause className="h-4 w-4 fill-current" strokeWidth={0} />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={0} />
              )}
            </span>
          )}
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
          <div
            onClick={premium ? handleSeek : undefined}
            className={`h-1 flex-1 overflow-hidden rounded-full bg-muted ${premium ? 'cursor-pointer' : ''}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
            {fmt(data?.duration_ms ?? 0)}
          </span>
        </div>
        {premium && (
          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={toggleShuffle}
              disabled={busy}
              aria-label="Toggle shuffle"
              className={`cursor-pointer transition-colors disabled:opacity-60 ${data?.shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Shuffle className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              onClick={() => runControl({ action: 'previous' })}
              disabled={busy}
              aria-label="Previous"
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              <SkipBack className="h-5 w-5 fill-current" strokeWidth={0} />
            </button>
            <button
              onClick={() => runControl({ action: 'next' })}
              disabled={busy}
              aria-label="Next"
              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              <SkipForward className="h-5 w-5 fill-current" strokeWidth={0} />
            </button>
            <button
              onClick={cycleRepeat}
              disabled={busy}
              aria-label="Repeat"
              className={`cursor-pointer transition-colors disabled:opacity-60 ${data?.repeat !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <RepeatIcon className="h-4 w-4" strokeWidth={2} />
            </button>
            <div className="ml-1 flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={e => handleVolume(Number(e.target.value))}
                aria-label="Volume"
                className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              />
            </div>
          </div>
        )}
        {!premium && data?.preview_url && (
          <button
            onClick={togglePreview}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary transition-all duration-200 hover:bg-primary/20"
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
