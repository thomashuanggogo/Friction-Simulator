import React from 'react';
import { PhysicsParams, SimulationState } from '../types/physics';
import { Gauge, RotateCcw, TrendingUp, Settings2, Play, Pause } from 'lucide-react';

interface PrimaryControlBarProps {
  params: PhysicsParams;
  setParams: React.Dispatch<React.SetStateAction<PhysicsParams>>;
  state: SimulationState;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetPosition: () => void;
  isAutoRamping: boolean;
  onStartAutoRamp: () => void;
  onStopAutoRamp: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
  lang: 'zh' | 'en';
}

export const PrimaryControlBar: React.FC<PrimaryControlBarProps> = ({
  params,
  setParams,
  state,
  isPlaying,
  onTogglePlay,
  onResetPosition,
  isAutoRamping,
  onStartAutoRamp,
  onStopAutoRamp,
  onToggleSettings,
  isSettingsOpen,
  lang,
}) => {
  const isZh = lang === 'zh';

  return (
    <div className="w-full bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 transition-all">
      {/* Left: Applied Force Pull Slider (0 ~ 120N) */}
      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Force readout & icon */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              {isZh ? '向右外加拉力 F' : 'Pull Force F'}
            </div>
            <div className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-base leading-none">
              {params.appliedForce}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">N</span>
            </div>
          </div>
        </div>

        {/* Slider & Quick Buttons */}
        <div className="flex-1 w-full flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={params.appliedForce}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  appliedForce: Math.max(0, parseInt(e.target.value, 10)),
                }))
              }
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 transition-all"
              aria-label={isZh ? '向右外加拉力 F' : 'Applied Pull Force F'}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 10, 20, 30, 50].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setParams((prev) => ({ ...prev, appliedForce: val }))}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all ${
                  params.appliedForce === val
                    ? 'bg-amber-500 text-white font-bold shadow-xs shadow-amber-500/30'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {val === 0 ? (isZh ? '0N(放開)' : '0N(Free)') : `${val}N`}
              </button>
            ))}

            <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline ml-1 font-mono">
              [臨界 fs,max = {state.maxStaticFriction.toFixed(1)}N]
            </span>
          </div>
        </div>
      </div>

      {/* Vertical separator */}
      <div className="hidden md:block w-px h-10 bg-slate-200 dark:bg-slate-800" />

      {/* Right: High-frequency action buttons */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
        {/* Auto Ramp Test Button */}
        <button
          type="button"
          onClick={isAutoRamping ? onStopAutoRamp : onStartAutoRamp}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
            isAutoRamping
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
          }`}
          title={
            isZh
              ? '平穩勻速加大拉力，親眼見證木塊滑動、F-f紅點跳落與a-t瞬間躍遷！'
              : 'Smoothly increases force to observe synchronized motion, F-f drop & a-t jump!'
          }
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>
            {isAutoRamping
              ? (isZh ? '停止加力' : 'Stop Ramp')
              : (isZh ? '⚡ 一鍵加力測試' : '⚡ Auto-Ramp')}
          </span>
        </button>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={onTogglePlay}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title={isPlaying ? (isZh ? '暫停模擬' : 'Pause') : (isZh ? '繼續模擬' : 'Play')}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {/* Reset Position */}
        <button
          type="button"
          onClick={onResetPosition}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title={isZh ? '木塊移回起點 (-6m)' : 'Reset Position (-6m)'}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Toggle Secondary Settings Drawer */}
        <button
          type="button"
          onClick={onToggleSettings}
          className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
            isSettingsOpen
              ? 'bg-slate-800 text-white dark:bg-slate-700 border-slate-700 dark:border-slate-600'
              : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
          }`}
          title={isZh ? '調整質量、摩擦係數、重力與接觸面' : 'Adjust Mass, μs, μk, Gravity & Surface'}
        >
          <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden sm:inline">
            {isZh ? '實驗參數' : 'Parameters'}
          </span>
        </button>
      </div>
    </div>
  );
};
