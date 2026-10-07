import React from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, BookOpen, Compass, Layers, Download } from 'lucide-react';
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
  onExportCSV?: () => void;
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
  onExportCSV,
}) => {
  const isZh = lang === 'zh';

  return (
    <header className="border-b border-black/[0.04] dark:border-white/[0.06] bg-white/75 dark:bg-slate-900/75 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-xs shadow-indigo-500/20">
            μ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {isZh ? '摩擦力互動模擬器' : 'Friction Physics Simulator'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {isZh
                ? '高一基礎物理 · 靜摩擦平衡 · 最大靜摩擦力 · 動摩擦定值 · 雙圖即時連動'
                : 'Physics Fundamentals · Static & Kinetic Friction · Synchronized F-f & a-t'}
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isPlaying
                ? 'bg-amber-100 hover:bg-amber-200/80 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
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

          {/* Reset position button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            title={isZh ? '重設模擬位置與速度 (-6m)' : 'Reset Position & Velocity'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Sound Toggle (Icon-only) */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-full transition-colors ${
              soundEnabled
                ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                : 'text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
            title={soundEnabled ? (isZh ? '靜音' : 'Mute') : (isZh ? '開啟音效' : 'Enable Audio')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theory Modal Button (Icon-only) */}
          <button
            onClick={onOpenTheory}
            className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title={isZh ? '查看物理原理與公式手冊' : 'View Physics Formulas'}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Export CSV (Icon-only) */}
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="p-1.5 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title={isZh ? '匯出實驗數據 CSV' : 'Export Experiment CSV'}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLang(isZh ? 'en' : 'zh')}
            className="px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-colors"
            title={isZh ? 'Switch to English' : '切換為繁體中文'}
          >
            {isZh ? 'EN' : '繁中'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-black/[0.03] dark:border-white/[0.04]">
        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'simulation'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{isZh ? '主模擬工作台 (動作、受力與 a-t 同屏)' : 'Main Dashboard (Motion, Force & a-t)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('microscopic')}
          className={`flex items-center gap-2 py-2 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'microscopic'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isZh ? '微觀接觸面視角 (凹凸咬合與分子冷焊)' : 'Microscopic Asperities & Adhesion'}</span>
        </button>
      </div>
    </header>
  );
};
