import React, { useRef, useEffect, useState } from 'react';
import { SimulationState, PhysicsParams } from '../types/physics';
import { ZoomIn, Info, Eye, ShieldCheck, Flame } from 'lucide-react';

interface MicroscopicViewProps {
  state: SimulationState;
  params: PhysicsParams;
  lang: 'zh' | 'en';
}

export const MicroscopicView: React.FC<MicroscopicViewProps> = ({
  state,
  params,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(3000); // 1000x to 5000x
  const [demonstrateAdhesion, setDemonstrateAdhesion] = useState<boolean>(true);
  const isZh = lang === 'zh';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 700;
    const height = 340;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dark sleek lab background
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#020617');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Grid lines for microscope reticle
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Microscope center interface line
    const interfaceY = height / 2;

    // Normal force compression factor: heavier mass compresses asperities deeper
    const compression = Math.min(12, (params.mass / 10) * 4);

    // Lateral displacement of upper surface asperities:
    // When static: slight elastic bond stretching proportional to applied force
    // When sliding: moves continuously with state.position * scale
    const lateralShift = state.isSliding
      ? (state.position * 400) % 60
      : (state.appliedForce / (state.maxStaticFriction || 1)) * 14;

    // 1. Lower Floor Asperities (Fixed)
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, interfaceY);

    const numPeaks = 18;
    const peakWidth = width / numPeaks;
    for (let i = 0; i <= numPeaks; i++) {
      const px = i * peakWidth;
      // Fixed pseudo-random peak heights
      const hOffset = Math.sin(i * 1.8) * 16 + Math.cos(i * 3.4) * 8;
      const peakY = interfaceY + hOffset;
      ctx.lineTo(px, peakY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Upper Block Asperities (Movable & compressed)
    const upperBaseY = interfaceY - 10 + compression;
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(0, upperBaseY);

    for (let i = 0; i <= numPeaks + 2; i++) {
      const px = i * peakWidth + lateralShift - peakWidth;
      const hOffset = Math.cos(i * 2.1) * 16 + Math.sin(i * 2.9) * 8;
      const peakY = upperBaseY + hOffset;
      ctx.lineTo(px, peakY);
    }
    ctx.lineTo(width, upperBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Highlight Contact Points & Cold-Welds / Adhesion Bonds
    if (demonstrateAdhesion) {
      // Find where top and bottom peaks meet
      for (let i = 0; i < numPeaks; i++) {
        const bottomPeakX = i * peakWidth;
        const bottomPeakY = interfaceY + Math.sin(i * 1.8) * 16 + Math.cos(i * 3.4) * 8;

        // Check if top peak is near
        for (let j = 0; j < numPeaks + 2; j++) {
          const topPeakX = j * peakWidth + lateralShift - peakWidth;
          const topPeakY = upperBaseY + Math.cos(j * 2.1) * 16 + Math.sin(j * 2.9) * 8;

          const dist = Math.hypot(bottomPeakX - topPeakX, bottomPeakY - topPeakY);
          if (dist < 18) {
            // Real contact point!
            const midX = (bottomPeakX + topPeakX) / 2;
            const midY = (bottomPeakY + topPeakY) / 2;

            if (!state.isSliding) {
              // Static cold-weld bond (green glow)
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(bottomPeakX, bottomPeakY);
              ctx.lineTo(topPeakX, topPeakY);
              ctx.stroke();

              ctx.fillStyle = '#4ade80';
              ctx.beginPath();
              ctx.arc(midX, midY, 4, 0, Math.PI * 2);
              ctx.fill();

              // Micro-weld tag
              ctx.font = '9px monospace';
              ctx.fillStyle = '#86efac';
              ctx.textAlign = 'center';
              ctx.fillText(isZh ? '分子冷焊點' : 'Cold Weld', midX, midY - 8);
            } else {
              // Kinetic shearing & thermal flash (orange/red spark)
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(bottomPeakX, bottomPeakY);
              ctx.lineTo(topPeakX, topPeakY);
              ctx.stroke();

              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.arc(midX, midY, 5 + Math.random() * 3, 0, Math.PI * 2);
              ctx.fill();

              ctx.font = '9px monospace';
              ctx.fillStyle = '#fdba74';
              ctx.textAlign = 'center';
              ctx.fillText(isZh ? '剪切斷裂 / 摩擦生熱' : 'Shearing', midX, midY - 10);
            }
          }
        }
      }
    }

    // Microscope HUD overlay
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 260, 80, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isZh ? `超高解析微觀界面 (×${zoomLevel})` : `Microscope View (×${zoomLevel})`, 28, 36);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText(
      state.isSliding
        ? (isZh ? '● 滑動中：微觀凹凸高速摩擦、剪切斷裂' : '● Kinetic: Rapid shearing & flash heating')
        : (isZh ? '● 靜止中：分子引力咬合 (微觀冷焊點)' : '● Static: Asperities interlock & cold-weld'),
      28,
      56
    );

    ctx.fillText(
      isZh
        ? `真實接觸面積 Areal ≈ ${(0.02 + (params.mass / 50) * 0.05).toFixed(3)}% 宏觀面積`
        : `Real Area Areal ≈ ${(0.02 + (params.mass / 50) * 0.05).toFixed(3)}% of apparent`,
      28,
      76
    );

    // Arrow indicator of upper block motion
    if (state.isSliding || Math.abs(state.appliedForce) > 0.1) {
      const dir = state.isSliding ? Math.sign(state.velocity) : Math.sign(state.appliedForce);
      const arrowX = width / 2;
      const arrowY = 32;
      ctx.strokeStyle = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(arrowX - dir * 30, arrowY);
      ctx.lineTo(arrowX + dir * 30, arrowY);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(arrowX + dir * 30, arrowY);
      ctx.lineTo(arrowX + dir * 20, arrowY - 6);
      ctx.lineTo(arrowX + dir * 20, arrowY + 6);
      ctx.closePath();
      ctx.fill();

      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isZh ? '上表面剪切受力方向' : 'Shear Direction', arrowX, arrowY - 12);
    }

  }, [state, params, zoomLevel, demonstrateAdhesion, isZh]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ZoomIn className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isZh ? '微觀接觸面機制：為什麼會產生摩擦力？' : 'Microscopic Physics: Origin of Friction'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isZh
              ? '放大數千倍觀察固體表面：微觀粗糙峰谷 (Asperities) 與分子間冷焊鍵結 (Cold Welding)'
              : 'Magnified view of solid interface: surface asperities and intermolecular cold welds'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDemonstrateAdhesion(!demonstrateAdhesion)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              demonstrateAdhesion
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isZh ? '標記微觀咬合點' : 'Highlight Bonds'}</span>
          </button>
        </div>
      </div>

      {/* Microscope Canvas */}
      <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-[320px] block select-none" />
      </div>

      {/* Educational Explanations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
            <ShieldCheck className="w-4 h-4" />
            <span>{isZh ? '1. 為什麼靜摩擦 > 動摩擦？' : '1. Why is μs > μk?'}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {isZh
              ? '靜止時，表面粗糙峰有充分時間陷落並在接觸點形成「微觀冷焊點 (Cold Welds)」。要啟動滑動必須先剪斷這些鍵結（峰值 fs,max）；一旦滑動起來，峰谷迅速掠過來不及充分咬合，故動摩擦力 fk 顯著下降。'
              : 'At rest, asperities sink into deep contact forming cold welds. Overcoming these requires peak force fs,max. Once moving, asperities skim over peaks with less time to adhere, reducing fk.'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <Info className="w-4 h-4" />
            <span>{isZh ? '2. 接觸面積迷思破解' : '2. The Contact Area Paradox'}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {isZh
              ? '將木塊翻成立放（宏觀接觸面變小），但壓強 P = FN / A 隨之成正比暴增！導致接觸峰谷被壓得更扁，最終「真實接觸面積 (Real Contact Area)」完全不變，因此古典摩擦力與宏觀面積無關！'
              : 'Flipping a block upright reduces apparent area, but pressure increases proportionately. The asperities deform more severely, keeping the true contact area A_real identical.'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4" />
            <span>{isZh ? '3. 功與熱能轉化' : '3. Work & Heat Dissipation'}</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {isZh
              ? '動摩擦力作負功，本質是微觀原子晶格劇烈碰撞與彈性恢復震盪（微觀聲子激發），將宏觀機械能 100% 耗散轉化為固體內能（熱量 Q = ∫|f·v|dt），這也是鑽木取火與煞車發燙的根本原理。'
              : 'Kinetic friction does negative work by exciting atomic lattice vibrations (phonons), converting macroscopic kinetic energy entirely into thermal heat (Q = ∫|f·v|dt).'}
          </p>
        </div>
      </div>
    </div>
  );
};
