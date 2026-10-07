import React, { useRef, useEffect } from 'react';
import { SimulationState, KinematicPoint } from '../types/physics';
import { Activity, RotateCcw, Clock, CheckCircle2, PauseCircle } from 'lucide-react';

interface AccelerationTimeChartProps {
  state: SimulationState;
  history: KinematicPoint[];
  lang: 'zh' | 'en';
  timeLimit: number;
  setTimeLimit: (sec: number) => void;
  autoStop: boolean;
  setAutoStop: (val: boolean) => void;
  onRestartTiming: () => void;
}

export const KinematicsCharts: React.FC<AccelerationTimeChartProps> = ({
  state,
  history,
  lang,
  timeLimit,
  setTimeLimit,
  autoStop,
  setAutoStop,
  onRestartTiming,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isZh = lang === 'zh';

  const currentA = state.acceleration;
  const currentNetF = state.netForce;
  const isTimeLimitReached = autoStop && state.time >= timeLimit;

  // Filter history points to within [0, timeLimit]
  const relevantHistory = history.filter((p) => p.time <= timeLimit);
  const peakA = relevantHistory.reduce((max, pt) => Math.max(max, Math.abs(pt.a)), 0);

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

    // Margins
    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Dynamic scale for Acceleration (at least 4 m/s^2)
    const maxHistA = relevantHistory.reduce((m, pt) => Math.max(m, Math.abs(pt.a)), 0);
    const maxA = Math.max(4, Math.ceil((Math.max(Math.abs(currentA), maxHistA) * 1.25) / 2) * 2);

    const zeroY = padT + plotH / 2;
    const scaleY = (val: number) => zeroY - (val / maxA) * (plotH / 2);

    // X axis scale: fixed range from 0 to timeLimit
    const scaleX = (t: number) => padL + (Math.max(0, Math.min(t, timeLimit)) / timeLimit) * plotW;

    // Horizontal grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;

    const gridSteps = [-maxA, -maxA / 2, 0, maxA / 2, maxA];
    for (const gVal of gridSteps) {
      const py = scaleY(gVal);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();

      // Y Labels
      ctx.fillStyle = gVal === 0 ? '#475569' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const labelStr = gVal > 0 ? `+${gVal.toFixed(0)}` : `${gVal.toFixed(0)}`;
      ctx.fillText(labelStr, padL - 6, py);
    }

    // Prominent zero acceleration baseline
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();

    // Zero label indicator
    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('a = 0', padL + plotW - 4, zeroY - 6);

    // Vertical time grid lines across [0, timeLimit]
    const stepTime = timeLimit <= 5 ? 1 : timeLimit <= 10 ? 2 : 5;
    for (let t = 0; t <= timeLimit; t += stepTime) {
      const px = scaleX(t);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, padT);
      ctx.lineTo(px, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${t}s`, px, padT + plotH + 5);
    }

    // Y Axis line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.stroke();

    // Y Axis unit label
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isZh ? '加速度 a (m/s²)' : 'Acceleration a (m/s²)', 0, 0);
    ctx.restore();

    // X Axis label
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isZh ? `時間 t (0 ~ ${timeLimit}s)` : `Time t (0 ~ ${timeLimit}s)`, padL + plotW / 2, height - 10);

    // Stop limit line at right edge
    const stopPxX = scaleX(timeLimit);
    ctx.save();
    ctx.setLineDash([3, 2]);
    ctx.strokeStyle = isTimeLimitReached ? '#ef4444' : '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(stopPxX, padT);
    ctx.lineTo(stopPxX, padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Draw curve and shaded area
    if (relevantHistory.length > 1) {
      // 1. Shaded area under the a(t) curve to zero baseline
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scaleX(relevantHistory[0].time), zeroY);
      for (let i = 0; i < relevantHistory.length; i++) {
        ctx.lineTo(scaleX(relevantHistory[i].time), scaleY(relevantHistory[i].a));
      }
      ctx.lineTo(scaleX(relevantHistory[relevantHistory.length - 1].time), zeroY);
      ctx.closePath();

      const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      areaGrad.addColorStop(0, 'rgba(124, 58, 237, 0.25)'); // purple for +a
      areaGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.05)');
      areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.20)'); // red for -a
      ctx.fillStyle = areaGrad;
      ctx.fill();
      ctx.restore();

      // 2. Continuous a(t) curve
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < relevantHistory.length; i++) {
        const px = scaleX(relevantHistory[i].time);
        const py = scaleY(relevantHistory[i].a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 3. Current Live Point & Value Readout
      const currPt = relevantHistory[relevantHistory.length - 1];
      const curPx = scaleX(currPt.time);
      const curPy = scaleY(currPt.a);

      // Pulsing outer halo
      const haloGrad = ctx.createRadialGradient(curPx, curPy, 2, curPx, curPy, 10);
      haloGrad.addColorStop(0, isTimeLimitReached ? 'rgba(239, 68, 68, 0.6)' : 'rgba(124, 58, 237, 0.6)');
      haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(curPx, curPy, 10, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = isTimeLimitReached ? '#dc2626' : '#6d28d9';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Live Readout Label
      ctx.fillStyle = isTimeLimitReached ? '#b91c1c' : '#4c1d95';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = curPx > width - 110 ? 'right' : 'left';
      const labelX = curPx > width - 110 ? curPx - 8 : curPx + 8;
      ctx.fillText(
        `a = ${currPt.a >= 0 ? '+' : ''}${currPt.a.toFixed(2)} m/s²`,
        labelX,
        curPy - 6
      );
    }

    // Top formula badge
    ctx.fillStyle = '#6d28d9';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('a(t) = Fnet / m', padL + 8, padT + 14);

    // Stop banner if reached or wall hit
    if (state.hitRightWall || isTimeLimitReached) {
      ctx.fillStyle = state.hitRightWall ? 'rgba(225, 29, 72, 0.92)' : 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(plotW + padL - 110, padT + 6, 106, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const stopText = state.hitRightWall
        ? (isZh ? '🧱 撞牆停止' : '🧱 Hit Wall')
        : (isZh ? '⏱ 已停止計時' : '⏱ Time Stopped');
      ctx.fillText(stopText, plotW + padL - 57, padT + 19);
    }

  }, [state.time, state.acceleration, state.hitRightWall, relevantHistory, timeLimit, isTimeLimitReached, currentA, isZh]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            {isZh ? '加速度 - 時間關係圖 (a - t 圖)' : 'Acceleration - Time Diagram (a - t)'}
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-medium border border-purple-200 dark:border-purple-800/40">
            a = Fnet / m
          </span>
        </div>

        {/* Time duration limit buttons & auto stop */}
        <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 px-1 flex items-center gap-0.5 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>{isZh ? '計時長度:' : 'Limit:'}</span>
            </span>
            {[5, 10, 15, 20].map((sec) => (
              <button
                key={sec}
                onClick={() => setTimeLimit(sec)}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  timeLimit === sec
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          <button
            onClick={onRestartTiming}
            className="px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1 transition-colors text-xs"
            title={isZh ? '重設時間並移回 -6m 重新記錄 a-t 曲線' : 'Reset time and position to -6m'}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isZh ? '重新計時' : 'Restart'}</span>
          </button>
        </div>
      </div>

      {/* Status banner when wall is hit or limit is reached */}
      {state.hitRightWall ? (
        <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <PauseCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              {isZh
                ? '木塊已撞到右側護欄，系統已自動停止計時並暫停！'
                : 'Block reached right wall! Timing stopped and simulation paused.'}
            </span>
          </div>
          <button
            onClick={onRestartTiming}
            className="text-[11px] underline font-bold hover:text-rose-950 dark:hover:text-rose-100 shrink-0 ml-2"
          >
            {isZh ? '移回起點重新計時' : 'Restart from -6m'}
          </button>
        </div>
      ) : isTimeLimitReached ? (
        <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium">
            <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {isZh
                ? `已達到設定時間上限 (${timeLimit}s)，系統已自動停止計時與記錄！`
                : `Time limit (${timeLimit}s) reached! Timing and recording automatically stopped.`}
            </span>
          </div>
          <button
            onClick={onRestartTiming}
            className="text-[11px] underline font-bold hover:text-amber-950 dark:hover:text-amber-100 shrink-0 ml-2"
          >
            {isZh ? '立即重新計時' : 'Restart Now'}
          </button>
        </div>
      ) : null}

      {/* a-t Canvas */}
      <div className="w-full bg-white dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex justify-center">
        <canvas ref={canvasRef} className="w-full h-[200px] block select-none" />
      </div>

      {/* Physics Telemetry Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {/* Instantaneous Acceleration */}
        <div className="p-2 rounded-lg bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40">
          <div className="text-[10px] text-purple-800 dark:text-purple-300 font-medium">
            {isZh ? '瞬時加速度 a' : 'Instant Accel a'}
          </div>
          <div className="font-mono font-bold text-purple-900 dark:text-purple-200 text-sm">
            {currentA >= 0 ? `+${currentA.toFixed(2)}` : currentA.toFixed(2)} m/s²
          </div>
          <div className="text-[9px] text-purple-600 dark:text-purple-400">
            {Math.abs(currentA) < 0.01
              ? (isZh ? '靜止 / 等速平衡' : 'Equilibrium (a=0)')
              : currentA > 0
              ? (isZh ? '向前加速中' : 'Accelerating')
              : (isZh ? '煞車減速中' : 'Decelerating')}
          </div>
        </div>

        {/* Current Elapsed Time vs Limit */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isZh ? '計時進度 (t / 上限)' : 'Elapsed Time (t / Limit)'}
          </div>
          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
            {state.time.toFixed(1)}s / {timeLimit}s
          </div>
          <div className="text-[9px] text-slate-400">
            {isTimeLimitReached ? (isZh ? '計時完成' : 'Completed') : (isZh ? '記錄中...' : 'Recording...')}
          </div>
        </div>

        {/* Peak Acceleration */}
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {isZh ? '峰值加速度 |a|max' : 'Peak Accel |a|max'}
          </div>
          <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
            {peakA.toFixed(2)} m/s²
          </div>
          <div className="text-[9px] text-slate-400">
            {isZh ? '本次記錄最大值' : 'Trial peak'}
          </div>
        </div>
      </div>
    </div>
  );
};
