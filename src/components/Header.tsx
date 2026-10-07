import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, BookOpen, Compass, Layers } from 'lucide-react';
import { ViewTab } from '../types/physics';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  onReset: () => void;
  lang: 'zh' | 'en';
  setLang: (lang: 'zh' | 'en') => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenTheory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  setIsPlaying,
  onReset,
  lang,
  setLang,
  soundEnabled,
  setSoundEnabled,
  onOpenTheory,
}) => {
  const isZh = lang === 'zh';

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            μ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {isZh ? '摩擦力互動模擬器' : 'Friction Physics Simulator'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {isZh
                ? '高一基礎物理 · 靜摩擦力 · 最大靜摩擦力 · 動摩擦力 · F-f 圖與 a-t 圖'
                : 'Physics Fundamentals · Static & Kinetic Friction · F-f & a-t Diagrams'}
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Play/Pause & Reset */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{isZh ? '暫停' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{isZh ? '開始模擬' : 'Run'}</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            title={isZh ? '重設模擬位置與速度' : 'Reset Simulation'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border transition-colors ${
              soundEnabled
                ? 'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Mute' : 'Enable Audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theory button */}
          <button
            onClick={onOpenTheory}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isZh ? '物理原理' : 'Theory'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(isZh ? 'en' : 'zh')}
            className="px-2 py-1 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isZh ? 'EN' : '繁中'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'simulation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{isZh ? '水平滑軌主模擬 & 實時曲線 (F-f 與 a-t)' : 'Horizontal Simulation & Real-time Curves'}</span>
        </button>

        <button
          onClick={() => setActiveTab('microscopic')}
          className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'microscopic'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isZh ? '微觀接觸面視角 (凹凸咬合與分子冷焊)' : 'Microscopic Asperities & Adhesion'}</span>
        </button>
      </div>
    </header>
  );
};
