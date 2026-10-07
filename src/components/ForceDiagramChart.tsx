import React, { useRef, useEffect } from 'react';
import { SimulationState, PhysicsParams, ForceChartPoint } from '../types/physics';
import { Play, RotateCcw, TrendingUp } from 'lucide-react';

interface ForceDiagramChartProps {
  state: SimulationState;
  params: PhysicsParams;
  history: ForceChartPoint[];
  lang: 'zh' | 'en';
  onClearHistory: () => void;
  isAutoRamping: boolean;
  onStartAutoRamp: () => void;
  onStopAutoRamp: () => void;
}

export const ForceDiagramChart: React.FC<ForceDiagramChartProps> = ({
  state,
  params,
  history,
  lang,
  onClearHistory,
  isAutoRamping,
  onStartAutoRamp,
  onStopAutoRamp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isZh = lang === 'zh';

  const fsMax = state.maxStaticFriction;
  const fk = state.kineticFrictionMag;

  // Render Chart Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 480;
    const height = 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Layout margins
    const padLeft = 48;
    const padRight = 20;
    const padTop = 26;
    const padBottom = 34;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Background - adapts smoothly to light/dark
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#0b1120' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Compute coordinate limits
    // Max F on X axis: at least 1.6 * fsMax, or max history point
    const maxHistF = history.reduce((max, pt) => Math.max(max, pt.appliedForce), 0);
    const maxValF = Math.max(fsMax * 1.6, maxHistF * 1.1, 40);
    const maxValf = Math.max(fsMax * 1.25, 30);

    const scaleX = (val: number) => padLeft + (val / maxValF) * plotW;
    const scaleY = (val: number) => padTop + plotH - (val / maxValf) * plotH;

    // Minimal faint grid lines (Data-Ink reduction)
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;

    // Horizontal grid
    const numYDivs = 4;
    for (let i = 0; i <= numYDivs; i++) {
      const yVal = (maxValf / numYDivs) * i;
      const py = scaleY(yVal);
      ctx.beginPath();
      ctx.moveTo(padLeft, py);
      ctx.lineTo(padLeft + plotW, py);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${yVal.toFixed(0)}`, padLeft - 6, py);
    }

    // Vertical grid
    const numXDivs = 5;
    for (let i = 0; i <= numXDivs; i++) {
      const xVal = (maxValF / numXDivs) * i;
      const px = scaleX(xVal);
      ctx.beginPath();
      ctx.moveTo(px, padTop);
      ctx.lineTo(px, padTop + plotH);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${xVal.toFixed(0)}`, px, padTop + plotH + 6);
    }

    // Minimal Axes Lines
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.font = '500 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isZh ? '外加拉力 F (N)' : 'Applied Force F (N)', padLeft + plotW / 2, height - 10);

    ctx.save();
    ctx.translate(12, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(isZh ? '摩擦力 f (N)' : 'Friction f (N)', 0, 0);
    ctx.restore();

    // 1. Shaded Regions: Static Zone vs Kinetic Zone
    const fsMaxPxX = scaleX(fsMax);
    if (fsMaxPxX <= padLeft + plotW) {
      // Static zone shading (light green)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
      ctx.fillRect(padLeft, padTop, fsMaxPxX - padLeft, plotH);

      // Kinetic zone shading (light blue)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(fsMaxPxX, padTop, padLeft + plotW - fsMaxPxX, plotH);
    }

    // Region text labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#059669';
    ctx.textAlign = 'left';
    ctx.fillText(isZh ? '靜摩擦區 (f = F)' : 'Static Zone (f = F)', padLeft + 8, padTop + 14);

    if (fsMaxPxX + 10 < padLeft + plotW) {
      ctx.fillStyle = '#2563eb';
      ctx.fillText(isZh ? '動摩擦區 (f = fk)' : 'Kinetic Zone (f = fk)', fsMaxPxX + 10, padTop + 14);
    }

    // 2. THEORETICAL CURVE (Textbook F-f curve)
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;

    // Line from (0,0) to (fsMax, fsMax)
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(0));
    ctx.lineTo(scaleX(fsMax), scaleY(fsMax));
    // Vertical drop from (fsMax, fsMax) to (fsMax, fk)
    ctx.lineTo(scaleX(fsMax), scaleY(fk));
    // Plateau horizontal line from (fsMax, fk) to maxValF
    ctx.lineTo(scaleX(maxValF), scaleY(fk));
    ctx.stroke();
    ctx.restore();

    // Dashed guide lines for fsMax and fk on Y-axis
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;

    // fsMax Y-guide
    ctx.beginPath();
    ctx.moveTo(padLeft, scaleY(fsMax));
    ctx.lineTo(scaleX(fsMax), scaleY(fsMax));
    ctx.stroke();

    // fk Y-guide
    ctx.beginPath();
    ctx.moveTo(padLeft, scaleY(fk));
    ctx.lineTo(scaleX(maxValF), scaleY(fk));
    ctx.stroke();
    ctx.restore();

    // fsMax Peak Point & Label
    const peakX = scaleX(fsMax);
    const peakY = scaleY(fsMax);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`fs,max = ${fsMax.toFixed(1)}N`, peakX, peakY - 10);

    // fk Plateau Label
    const plateauY = scaleY(fk);
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`fk = ${fk.toFixed(1)}N`, padLeft + plotW - 6, plateauY - 7);

    // 3. USER MEASUREMENT HISTORY TRAIL
    if (history.length > 1) {
      ctx.save();
      ctx.lineWidth = 2.5;
      for (let i = 1; i < history.length; i++) {
        const p1 = history[i - 1];
        const p2 = history[i];
        ctx.strokeStyle = p2.isSliding ? '#3b82f6' : '#10b981';
        ctx.beginPath();
        ctx.moveTo(scaleX(p1.appliedForce), scaleY(p1.frictionForce));
        ctx.lineTo(scaleX(p2.appliedForce), scaleY(p2.frictionForce));
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. CURRENT OPERATING POINT (Live Dot)
    const currentDriveF = Math.abs(state.appliedForce);
    const currentFriction = Math.abs(state.frictionForce);
    const currPxX = scaleX(currentDriveF);
    const currPxY = scaleY(currentFriction);

    // Glowing halo
    const haloGrad = ctx.createRadialGradient(currPxX, currPxY, 2, currPxX, currPxY, 12);
    haloGrad.addColorStop(0, state.isSliding ? 'rgba(59, 130, 246, 0.6)' : 'rgba(16, 185, 129, 0.6)');
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(currPxX, currPxY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Solid inner dot
    ctx.fillStyle = state.isSliding ? '#2563eb' : '#059669';
    ctx.beginPath();
    ctx.arc(currPxX, currPxY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Live Readout Tag near point
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = currPxX > width - 110 ? 'right' : 'left';
    const tagX = currPxX > width - 110 ? currPxX - 8 : currPxX + 8;
    ctx.fillText(`(${currentDriveF.toFixed(1)}, ${currentFriction.toFixed(1)})`, tagX, currPxY - 6);

  }, [state, params, history, isZh, fsMax, fk]);

  return (
    <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-3 sm:p-3.5 shadow-sm flex flex-col gap-2.5 transition-all">
      {/* Minimal Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">
            {isZh ? '受力特徵圖 (F - f 曲線)' : 'F - f Characteristic Curve'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Auto ramp test button */}
          <button
            onClick={isAutoRamping ? onStopAutoRamp : onStartAutoRamp}
            className={`px-2 py-0.5 text-[11px] rounded-lg font-semibold flex items-center gap-1 transition-all ${
              isAutoRamping
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/50'
            }`}
            title={isZh ? '自動平穩加力，畫出受力特徵曲線' : 'Auto ramp force test'}
          >
            <Play className="w-3 h-3" />
            <span>{isAutoRamping ? (isZh ? '停止' : 'Stop') : (isZh ? '自動加力' : 'Auto Ramp')}</span>
          </button>

          {/* Clear History */}
          <button
            onClick={onClearHistory}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isZh ? '清除軌跡記錄' : 'Clear recorded trail'}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200/40 dark:border-white/[0.04] overflow-hidden flex justify-center">
        <canvas ref={canvasRef} className="w-full h-[190px] block select-none" />
      </div>

      {/* Characteristic Metrics Ribbon */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/[0.04]">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isZh ? '最大靜摩擦力' : 'Max Static fs,max'}
          </div>
          <div className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
            {fsMax.toFixed(1)} N
          </div>
          <div className="text-[9px] text-slate-400">μs·FN</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/[0.04]">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isZh ? '動摩擦力' : 'Kinetic fk'}
          </div>
          <div className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
            {fk.toFixed(1)} N
          </div>
          <div className="text-[9px] text-slate-400">μk·FN</div>
        </div>

        <div className="p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/[0.04]">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isZh ? '摩擦力降幅 Δf' : 'Drop Δf'}
          </div>
          <div className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
            {(fsMax - fk).toFixed(1)} N
          </div>
          <div className="text-[9px] text-slate-400">{(((fsMax - fk) / (fsMax || 1)) * 100).toFixed(0)}% 跌落</div>
        </div>
      </div>
    </div>
  );
};
