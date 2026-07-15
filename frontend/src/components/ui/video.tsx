import * as React from "react";
import { Maximize, Pause, Play, Settings, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

function clampTime(value: number, duration: number) {
  return Math.min(Math.max(0, value), duration);
}

function formatTime(value: number) {
  const rounded = Math.round(value);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export interface VideoPlayerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onTimeUpdate"> {
  currentTime?: number;
  defaultCurrentTime?: number;
  defaultMuted?: boolean;
  defaultPlaying?: boolean;
  duration?: number;
  label?: string;
  muted?: boolean;
  onFullscreen?: () => void;
  onMutedChange?: (muted: boolean) => void;
  onPlayingChange?: (playing: boolean) => void;
  onSettings?: () => void;
  onTimeChange?: (seconds: number) => void;
  playing?: boolean;
  poster?: React.ReactNode;
  showControls?: boolean;
  showFullscreen?: boolean;
  showSettings?: boolean;
}

const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      currentTime: controlledCurrentTime,
      defaultCurrentTime = 0,
      defaultMuted = false,
      defaultPlaying = false,
      duration = 330,
      label = "Video player",
      muted: controlledMuted,
      onFullscreen,
      onMutedChange,
      onPlayingChange,
      onSettings,
      onTimeChange,
      playing: controlledPlaying,
      poster,
      showControls = true,
      showFullscreen = true,
      showSettings = true,
      style,
      ...props
    },
    ref,
  ) => {
    const safeDuration = Math.max(0, duration);
    const [internalCurrentTime, setInternalCurrentTime] = React.useState(() => clampTime(defaultCurrentTime, safeDuration));
    const [internalMuted, setInternalMuted] = React.useState(defaultMuted);
    const [internalPlaying, setInternalPlaying] = React.useState(defaultPlaying);

    const currentTime = clampTime(controlledCurrentTime ?? internalCurrentTime, safeDuration);
    const muted = controlledMuted ?? internalMuted;
    const playing = controlledPlaying ?? internalPlaying;
    const progress = safeDuration === 0 ? 0 : (currentTime / safeDuration) * 100;

    const updateCurrentTime = (nextTime: number) => {
      const normalizedTime = clampTime(nextTime, safeDuration);
      if (controlledCurrentTime === undefined) setInternalCurrentTime(normalizedTime);
      onTimeChange?.(normalizedTime);
    };

    const updateMuted = (nextMuted: boolean) => {
      if (controlledMuted === undefined) setInternalMuted(nextMuted);
      onMutedChange?.(nextMuted);
    };

    const updatePlaying = (nextPlaying: boolean) => {
      if (controlledPlaying === undefined) setInternalPlaying(nextPlaying);
      onPlayingChange?.(nextPlaying);
    };

    const controlButtonClass =
      "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--air-color-text-inverse)] hover:bg-white/15 active:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--air-color-interaction-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--air-color-bg-inverse)]";

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn(
          "flex w-[500px] max-w-full flex-col overflow-hidden rounded-lg border border-[var(--air-color-border-default)] bg-[var(--air-color-bg-subtle)] text-[var(--air-color-text-primary)]",
          className,
        )}
        style={{ aspectRatio: "5 / 3", ...style }}
        {...props}
      >
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--air-color-bg-subtle)]">
          {poster ?? <span className="text-sm font-medium text-[var(--air-color-text-secondary)]">Poster content</span>}
        </div>

        {showControls ? (
          <div
            className="relative h-12 shrink-0"
            data-video-controls="true"
            style={{ backgroundColor: "var(--air-color-bg-inverse, #0f172a)", color: "var(--air-color-text-inverse, #ffffff)" }}
          >
            <div className="absolute inset-x-0 top-0 z-10 h-4 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--air-color-interaction-focus)]">
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  backgroundColor: "#334155",
                  backgroundImage: `linear-gradient(to right, var(--air-color-interaction-progress, #00c2f3) 0%, var(--air-color-interaction-progress, #00c2f3) ${progress}%, transparent ${progress}%, transparent 100%)`,
                }}
              />
              <input
                aria-label="Video progress"
                className="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
                max={safeDuration}
                min={0}
                onChange={(event) => updateCurrentTime(Number(event.currentTarget.value))}
                step={1}
                type="range"
                value={currentTime}
              />
            </div>
            <div className="flex h-full items-center justify-between px-2 pt-1">
              <div className="flex h-11 w-[88px] items-center">
                <button
                  aria-label={playing ? "Pause video" : "Play video"}
                  className={controlButtonClass}
                  onClick={() => updatePlaying(!playing)}
                  type="button"
                >
                  {playing ? <Pause aria-hidden="true" size={24} /> : <Play aria-hidden="true" size={24} />}
                </button>
                <button
                  aria-label={muted ? "Unmute video" : "Mute video"}
                  className={controlButtonClass}
                  onClick={() => updateMuted(!muted)}
                  type="button"
                >
                  {muted ? <VolumeX aria-hidden="true" size={24} /> : <Volume2 aria-hidden="true" size={24} />}
                </button>
              </div>
              <div className="flex h-11 w-[208px] items-center">
                <span
                  aria-label={`${formatTime(currentTime)} elapsed of ${formatTime(safeDuration)}`}
                  className="flex h-11 w-24 shrink-0 items-center gap-1 px-2 text-xs font-medium tabular-nums text-[var(--air-color-text-inverse)]"
                >
                  <span>{formatTime(currentTime)}</span>
                  <span aria-hidden="true">/</span>
                  <span>{formatTime(safeDuration)}</span>
                </span>
                {showSettings ? (
                  <button aria-label="Video settings" className={controlButtonClass} onClick={onSettings} type="button">
                    <Settings aria-hidden="true" size={24} />
                  </button>
                ) : null}
                {showFullscreen ? (
                  <button aria-label="Enter fullscreen" className={controlButtonClass} onClick={onFullscreen} type="button">
                    <Maximize aria-hidden="true" size={24} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
