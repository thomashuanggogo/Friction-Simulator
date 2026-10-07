import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { ControlsPanel } from './ControlsPanel';
import {
  PhysicsParams,
  VisualSettings,
  SimulationState,
  ForceChartPoint,
} from '../types/physics';

interface SecondarySettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  params: PhysicsParams;
  setParams: React.Dispatch<React.SetStateAction<PhysicsParams>>;
  state: SimulationState;
  visuals: VisualSettings;
  setVisuals: React.Dispatch<React.SetStateAction<VisualSettings>>;
  lang: 'zh' | 'en';
  chartHistory: ForceChartPoint[];
}

export const SecondarySettingsDrawer: React.FC<SecondarySettingsDrawerProps> = ({
  isOpen,
  onClose,
  params,
  setParams,
  state,
  visuals,
  setVisuals,
  lang,
  chartHistory,
}) => {
  if (!isOpen) return null;

  const isZh = lang === 'zh';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border-l border-slate-200/60 dark:border-white/[0.08] h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isZh ? '實驗進階參數微調' : 'Experiment Parameters'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isZh ? '關閉面板' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <ControlsPanel
            params={params}
            setParams={setParams}
            state={state}
            visuals={visuals}
            setVisuals={setVisuals}
            lang={lang}
            chartHistory={chartHistory}
            hidePrimaryForce={true}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200/60 dark:border-white/[0.06] bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            {isZh ? '完成並返回模擬' : 'Done & Return to Simulation'}
          </button>
        </div>
      </div>
    </div>
  );
};
