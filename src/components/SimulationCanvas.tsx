import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SimulationState, PhysicsParams, VisualSettings } from '../types/physics';
import { MATERIAL_PRESETS } from '../utils/materials';

interface SimulationCanvasProps {
  state: SimulationState;
  params: PhysicsParams;
  visuals: VisualSettings;
  lang: 'zh' | 'en';
  onForceChange: (newForce: number) => void;
  onResetPosition: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  state,
  params,
  visuals,
  lang,
  onForceChange,
  onResetPosition,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const initialForceRef = useRef<number>(0);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 250 });

  const isZh = lang === 'zh';
  const currentMaterial = MATERIAL_PRESETS.find((m) => m.id === params.materialId) || MATERIAL_PRESETS[0];

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const { clientWidth } = canvasRef.current.parentElement;
        const width = Math.max(340, Math.min(clientWidth, 1200));
        const height = 250;
        setCanvasSize({ width, height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle particle spawns on motion
  useEffect(() => {
    if (visuals.showParticles && state.isSliding && Math.abs(state.velocity) > 0.05) {
      const count = Math.min(3, Math.ceil(Math.abs(state.velocity) * 1.5));
      const dir = -Math.sign(state.velocity);
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: state.position,
          y: 0,
          vx: (dir * (0.8 + Math.random() * 1.5) + (Math.random() - 0.5)) * 0.4,
          vy: 0.3 + Math.random() * 0.8,
          alpha: 1,
          life: 0,
          maxLife: 20 + Math.random() * 20,
          size: 1.5 + Math.random() * 2.5,
          color: currentMaterial.surfacePattern === 'ice' ? '#a5f3fc' : '#f59e0b',
        });
      }
    }
  }, [state.position, state.velocity, state.isSliding, visuals.showParticles, currentMaterial]);

  // Mouse & Touch interaction for dragging force
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    dragStartXRef.current = clientX;
    initialForceRef.current = params.appliedForce;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [params.appliedForce]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const deltaX = currentX - dragStartXRef.current;
    // Map pixels to Newtons (1 px = 0.8 N, clamp 0 to 120N)
    const forceDelta = deltaX * 0.8;
    const newForce = Math.round(Math.max(0, Math.min(120, initialForceRef.current + forceDelta)));
    onForceChange(newForce);
  }, [onForceChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    const w = canvasSize.width;
    const h = canvasSize.height;

    // Background gradient - Clean, subtle laboratory lighting
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.72, '#f1f5f9');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle laboratory precision dot grid (low Data-Ink ratio, completely non-intrusive)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
    for (let x = 20; x < w; x += 36) {
      for (let y = 18; y < h * 0.72 - 6; y += 36) {
        ctx.fillRect(x - 0.5, y - 0.5, 1.2, 1.2);
      }
    }

    // Scale: Pixels per meter
    const ppm = Math.max(30, Math.min(50, w / 18));
    const groundY = Math.round(h * 0.72);

    // 1. Draw Horizontal Ground Track
    ctx.save();
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, '#cbd5e1');
    groundGrad.addColorStop(0.1, '#94a3b8');
    groundGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Track surface line & color
    ctx.fillStyle = currentMaterial.color;
    ctx.fillRect(0, groundY - 6, w, 6);

    // Surface texture detail
    if (currentMaterial.surfacePattern === 'wood') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, groundY - 6);
        ctx.lineTo(x + 25, groundY);
        ctx.stroke();
      }
    } else if (currentMaterial.surfacePattern === 'ice') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(0, groundY - 6, w, 3);
    } else if (currentMaterial.surfacePattern === 'sandpaper') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let x = 5; x < w; x += 8) {
        ctx.fillRect(x, groundY - 5, 2, 2);
      }
    }

    // Track metric ruler markers
    if (visuals.showRuler) {
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;

      const centerX = w / 2;
      for (let m = -8; m <= 8; m += 2) {
        const rx = centerX + m * ppm;
        if (rx >= 10 && rx <= w - 10) {
          ctx.beginPath();
          ctx.moveTo(rx, groundY);
          ctx.lineTo(rx, groundY + 10);
          ctx.stroke();

          if (m === -6) {
            // Highlight starting position -6m
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(isZh ? '-6m (起點)' : '-6m (Start)', rx, groundY + 22);
            ctx.fillStyle = '#475569';
            ctx.font = '10px monospace';
          } else {
            ctx.fillText(`${m}m`, rx, groundY + 22);
          }
        }
      }
    }

    // Particles update & draw
    const centerX = w / 2;
    const blockPxX = centerX + state.position * ppm;

    particlesRef.current = particlesRef.current.filter((p) => {
      p.life++;
      p.x += p.vx * 0.05;
      p.y += p.vy * 0.05;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      const px = centerX + p.x * ppm;
      const py = groundY - 6 - p.y * ppm * 0.5;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      return p.life < p.maxLife;
    });

    // Block dimensions based on orientation (optimized for 220px canvas)
    let bw = 84;
    let bh = 42;
    if (params.orientation === 'flat') {
      bw = 96;
      bh = 36;
    } else if (params.orientation === 'side') {
      bw = 74;
      bh = 48;
    } else if (params.orientation === 'upright') {
      bw = 50;
      bh = 66;
    }

    // 2. Draw Right Wall Barrier (at x = 5.5m + half block width)
    const wallX = centerX + 5.5 * ppm + bw / 2;
    const wallH = 62;
    const wallW = 14;
    const wallY = groundY - 6 - wallH;

    // Wall main post
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(wallX, wallY, wallW, wallH + 6);
    ctx.strokeRect(wallX, wallY, wallW, wallH + 6);

    // Hazard stripes on barrier
    ctx.fillStyle = '#f59e0b';
    for (let sy = wallY + 6; sy < groundY; sy += 16) {
      ctx.fillRect(wallX + 2, sy, wallW - 4, 8);
    }

    // Rubber bumper pad facing incoming block
    ctx.fillStyle = state.hitRightWall ? '#ef4444' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(wallX - 8, wallY + 14, 8, wallH - 26, [4, 0, 0, 4]);
    ctx.fill();

    // Wall top label
    ctx.fillStyle = state.hitRightWall ? '#dc2626' : '#64748b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isZh ? '右側護欄' : 'Right Wall', wallX + wallW / 2, wallY - 6);

    const bx = blockPxX - bw / 2;
    const by = groundY - 6 - bh;

    // Block Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(bx + 4, groundY - 5, bw - 8, 4);

    // Block Body
    ctx.save();
    const blockGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
    blockGrad.addColorStop(0, currentMaterial.blockColor);
    blockGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = blockGrad;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    // Block texture highlight line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + 6, by + 6);
    ctx.lineTo(bx + bw - 6, by + 6);
    ctx.stroke();

    // Mass Label on block
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${params.mass.toFixed(1)} kg`, blockPxX, by + bh / 2 - 6);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`μs=${params.muS.toFixed(2)}  μk=${params.muK.toFixed(2)}`, blockPxX, by + bh / 2 + 10);
    ctx.restore();

    // Center point of block
    const centerBoxX = blockPxX;
    const centerBoxY = by + bh / 2;

    // Vectors (FBD)
    if (visuals.showVectors) {
      drawVectorsHorizontal(ctx, centerBoxX, centerBoxY, groundY - 6, bw, bh, state, visuals, isZh);
    }

    // Dynamometer Spring Scale & Pull handle
    drawDynamometerAndTether(ctx, centerBoxX, centerBoxY, bw, params.appliedForce, isZh);

    ctx.restore();

  }, [
    state,
    params,
    visuals,
    canvasSize,
    currentMaterial,
    isZh,
    onForceChange,
  ]);

  return (
    <div className="relative w-full bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] overflow-hidden shadow-sm flex flex-col transition-all">
      {/* Canvas Header / Status Bar */}
      <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-slate-200/50 dark:border-white/[0.05] flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3">
          {/* Status Badge with Luminous Glow */}
          {state.hitRightWall ? (
            <span className="px-3 py-1 rounded-xl font-bold inline-flex items-center gap-2 bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-500/40 shadow-xs shadow-rose-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              {isZh ? '🧱 抵達右端護欄！已停止計時' : '🧱 Hit Right Wall! Timing Stopped'}
            </span>
          ) : (
            <span
              className={`px-3 py-1 rounded-xl font-bold inline-flex items-center gap-2 transition-all ${
                state.stateType === 'impending_slip'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200 border border-amber-500/50 ring-4 ring-amber-500/25 shadow-md shadow-amber-500/20 animate-pulse'
                  : state.stateType === 'kinetic_sliding'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-200 border border-rose-500/50 ring-4 ring-rose-500/25 shadow-md shadow-rose-500/20'
                  : state.stateType === 'decelerating'
                  ? 'bg-orange-500/15 text-orange-700 dark:text-orange-200 border border-orange-500/40 ring-2 ring-orange-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  state.stateType === 'impending_slip'
                    ? 'bg-amber-500 animate-ping'
                    : state.stateType === 'kinetic_sliding'
                    ? 'bg-rose-500 animate-pulse'
                    : state.stateType === 'decelerating'
                    ? 'bg-orange-500'
                    : 'bg-emerald-500'
                }`}
              />
              {state.stateType === 'static_rest' && (isZh ? '靜止平衡 (f = F)' : 'At Rest (f = F)')}
              {state.stateType === 'impending_slip' && (isZh ? '⚡ 臨界躍遷點！(達最大靜摩擦力 fs,max)' : '⚡ Impending Slip (Peak fs,max)')}
              {state.stateType === 'kinetic_sliding' && (isZh ? '🔥 滑動加速中！(動摩擦力 fk 恆定)' : '🔥 Sliding (Constant fk)')}
              {state.stateType === 'decelerating' && (isZh ? '摩擦減速中' : 'Decelerating')}
            </span>
          )}

          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            {isZh ? '摩擦力:' : 'Friction:'}{' '}
            <strong className="text-slate-900 dark:text-slate-100 font-mono text-xs">
              {Math.abs(state.frictionForce).toFixed(1)} N
            </strong>
          </span>

          <span className="text-slate-500 dark:text-slate-400 hidden md:inline text-[11px]">
            ({isZh ? '臨界' : 'Peak'} fs,max ={' '}
            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
              {state.maxStaticFriction.toFixed(1)} N
            </span>
            , {isZh ? '動摩擦' : 'Kinetic'} fk ={' '}
            <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
              {state.kineticFrictionMag.toFixed(1)} N
            </span>
            )
          </span>
        </div>

        {/* Quick Position Reset if at border */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] hidden lg:inline">
            {isZh ? '💡 可在畫布上向右拖曳彈簧秤拉動木塊' : '💡 Drag rightward on canvas to pull'}
          </span>
          {(state.position > 4.5 || state.hitRightWall) && (
            <button
              onClick={onResetPosition}
              className="px-2 py-0.5 text-[11px] bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
            >
              {isZh ? '移回起點 (-6m)' : 'Reset to Start (-6m)'}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="w-full flex-1 touch-none cursor-ew-resize relative flex justify-center items-center">
        <canvas
          ref={canvasRef}
          style={{ width: canvasSize.width, height: canvasSize.height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block w-full h-auto select-none"
        />
      </div>

      {/* Canvas Bottom Legend */}
      <div className="px-4 py-2 bg-slate-50/60 dark:bg-slate-900/60 border-t border-slate-200/50 dark:border-white/[0.05] flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>{isZh ? '正向力 FN' : 'Normal FN'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>{isZh ? '摩擦力 f' : 'Friction f'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>{isZh ? '外加拉力 F' : 'Applied F'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>{isZh ? '重力 W' : 'Gravity W'}</span>
          </span>
          {visuals.showNetForce && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>{isZh ? '合外力 Fnet' : 'Net Force'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
          <span>x = {state.position.toFixed(2)} m</span>
          <span>v = {state.velocity.toFixed(2)} m/s</span>
          <span>a = {state.acceleration.toFixed(2)} m/s²</span>
        </div>
      </div>
    </div>
  );
};

// Vector drawing helpers
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number = 2.5,
  label?: string
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 3) return;

  const headLen = Math.min(12, Math.max(6, len * 0.25));
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrow Head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Label tag
  if (label) {
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tagDist = 14;
    const tagX = toX + Math.cos(angle) * tagDist;
    const tagY = toY + Math.sin(angle) * tagDist;

    const metrics = ctx.measureText(label);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(tagX - metrics.width / 2 - 3, tagY - 7, metrics.width + 6, 14);

    ctx.fillStyle = color;
    ctx.fillText(label, tagX, tagY);
  }
  ctx.restore();
}

function drawVectorsHorizontal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  groundY: number,
  bw: number,
  bh: number,
  state: SimulationState,
  visuals: VisualSettings,
  isZh: boolean
) {
  const scale = 0.95; // pixels per Newton (scaled for compact viewport)

  // 1. Normal Force FN (Upward, starts at ground interface)
  if (state.normalForce > 0.1) {
    const fnLen = Math.min(80, state.normalForce * scale);
    const label = visuals.showVectorValues ? `FN = ${state.normalForce.toFixed(1)}N` : 'FN';
    drawArrow(ctx, cx, groundY, cx, groundY - fnLen, '#10b981', 3, label);
  }

  // 2. Gravity W (Downward, starts at block center)
  const fgLen = Math.min(75, state.normalForce * scale);
  const fgLabel = visuals.showVectorValues ? `W = ${state.normalForce.toFixed(1)}N` : 'W';
  drawArrow(ctx, cx, cy, cx, cy + fgLen, '#6366f1', 3, fgLabel);

  // 3. Friction Force f (Starts at contact floor, opposing rightward pull/motion)
  if (Math.abs(state.frictionForce) > 0.05) {
    const fLen = Math.min(90, Math.abs(state.frictionForce) * scale);
    const fDir = -1; // Friction always acts to the left opposing rightward pull
    const fLabel = visuals.showVectorValues
      ? `${state.isSliding ? 'fk' : 'fs'} = ${Math.abs(state.frictionForce).toFixed(1)}N`
      : 'f';
    drawArrow(ctx, cx, groundY, cx + fDir * fLen, groundY, '#ef4444', 3.5, fLabel);
  }

  // 4. Applied Force F (From block right edge pulling towards right)
  if (state.appliedForce > 0.1) {
    const fExtLen = Math.min(100, state.appliedForce * scale);
    const startX = cx + bw / 2;
    const fExtLabel = visuals.showVectorValues ? `F = ${state.appliedForce.toFixed(0)}N` : 'F';
    drawArrow(ctx, startX, cy, startX + fExtLen, cy, '#f59e0b', 3.5, fExtLabel);
  }

  // 5. Net Force (Optional)
  if (visuals.showNetForce && Math.abs(state.netForce) > 0.1) {
    const netLen = Math.min(85, Math.abs(state.netForce) * scale);
    const netDir = Math.sign(state.netForce);
    drawArrow(
      ctx,
      cx,
      cy - bh / 2 - 16,
      cx + netDir * netLen,
      cy - bh / 2 - 16,
      '#06b6d4',
      2,
      `Fnet = ${state.netForce.toFixed(1)}N`
    );
  }

  // 6. Velocity Vector (Optional)
  if (visuals.showVelocityVector && Math.abs(state.velocity) > 0.05) {
    const vLen = Math.min(75, Math.abs(state.velocity) * 18);
    const vDir = Math.sign(state.velocity);
    drawArrow(
      ctx,
      cx,
      cy - bh / 2 - 30,
      cx + vDir * vLen,
      cy - bh / 2 - 30,
      '#eab308',
      2,
      `v = ${state.velocity.toFixed(2)}m/s`
    );
  }
}

function drawDynamometerAndTether(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bw: number,
  appliedForce: number,
  isZh: boolean
) {
  if (appliedForce < 0.1) return;

  const startX = cx + bw / 2; // Right edge of block

  // Spring scale cylinder to the right
  const dynWidth = 56;
  const dynHeight = 15;
  const dynX = startX + 18;
  const dynY = cy - dynHeight / 2;

  // Connecting cord from block to spring scale
  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, cy);
  ctx.lineTo(dynX, cy);
  ctx.stroke();

  // Spring casing
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(dynX, dynY, dynWidth, dynHeight, 4);
  ctx.fill();
  ctx.stroke();

  // Spring zig-zag inside
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  const zigSegments = 5;
  const segW = (dynWidth - 12) / zigSegments;
  let currX = dynX + 6;
  ctx.moveTo(currX, cy);
  for (let i = 0; i < zigSegments; i++) {
    const yOff = i % 2 === 0 ? -4 : 4;
    ctx.lineTo(currX + segW / 2, cy + yOff);
    ctx.lineTo(currX + segW, cy);
    currX += segW;
  }
  ctx.stroke();

  // Pull ring handle on right end
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(dynX + dynWidth + 8, cy, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Force readout text on dynamometer
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`F = ${appliedForce.toFixed(0)} N`, dynX + dynWidth / 2, dynY - 2);

  ctx.restore();
}
