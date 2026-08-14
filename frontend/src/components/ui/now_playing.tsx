import { Music4, Play, SkipBack, SkipForward } from 'lucide-react';
import { Waveform } from '../decor';

export const NOW_PLAYING = {
  title: 'slow mornings',
  artist: 'huni radio',
  genre: 'lo-fi',
  time: '01:24',
  total: '03:12',
} as const;

export function NowPlayingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(135deg,#9ec1a3,#f0d9b5)]">
          <Music4 className="h-7 w-7 text-white/90" strokeWidth={1.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-unna text-base font-bold italic text-foreground">{NOW_PLAYING.title}</p>
          <p className="mt-0.5 font-cousine text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
            {NOW_PLAYING.genre} · now playing
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
          {NOW_PLAYING.time}
        </span>
        <div className="flex items-center gap-3">
          <SkipBack className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Play className="ml-0.5 h-3 w-3 fill-current" strokeWidth={0} />
          </span>
          <SkipForward className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <span className="font-cousine text-[0.5rem] tracking-widest text-muted-foreground">
          {NOW_PLAYING.total}
        </span>
      </div>
    </div>
  );
}

export default NowPlayingCard;
