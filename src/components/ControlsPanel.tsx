import React from 'react';
import {
  PhysicsParams,
  VisualSettings,
  SimulationState,
  ForceChartPoint,
} from '../types/physics';
import { MATERIAL_PRESETS, GRAVITY_PRESETS } from '../utils/materials';
import {
  Sliders,
  Globe2,
  Gauge,
  Eye,
  Download,
  RotateCcw,
  Info,
  TrendingUp,
} from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  formula?: string;
  description: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, formula, description }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-1 align-middle"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:text-indigo-600 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
        aria-label={title}
        title={description}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-56 sm:w-64 p-2.5 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-slate-100 text-[11px] leading-relaxed shadow-xl border border-slate-700/80 z-50 pointer-events-none backdrop-blur-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="font-bold text-white mb-1 flex items-center justify-between gap-1">
            <span>{title}</span>
            {formula && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {formula}
              </span>
            )}
          </span>
          <span className="text-slate-300 block text-[10.5px]">{description}</span>
          <span className="absolute top-full left-3 sm:left-1/2 sm:-translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800" />
        </span>
      )}
    </span>
  );
};

interface ControlsPanelProps {
  params: PhysicsParams;
  setParams: React.Dispatch<React.SetStateAction<PhysicsParams>>;
  state: SimulationState;
  visuals: VisualSettings;
  setVisuals: React.Dispatch<React.SetStateAction<VisualSettings>>;
  lang: 'zh' | 'en';
  chartHistory: ForceChartPoint[];
  isAutoRamping?: boolean;
  onStartAutoRamp?: () => void;
  onStopAutoRamp?: () => void;
  hidePrimaryForce?: boolean;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  params,
  setParams,
  state,
  visuals,
  setVisuals,
  lang,
  chartHistory,
  isAutoRamping,
  onStartAutoRamp,
  onStopAutoRamp,
  hidePrimaryForce = false,
}) => {
  const isZh = lang === 'zh';

  const handleMaterialChange = (matId: string) => {
    const found = MATERIAL_PRESETS.find((m) => m.id === matId);
    if (found) {
      setParams((prev) => ({
        ...prev,
        materialId: found.id,
        muS: found.muS,
        muK: found.muK,
      }));
    }
  };

  const handleMuSChange = (val: number) => {
    setParams((prev) => ({
      ...prev,
      materialId: 'custom',
      muS: val,
      muK: Math.min(prev.muK, val), // muK cannot exceed muS
    }));
  };

  const handleMuKChange = (val: number) => {
    setParams((prev) => ({
      ...prev,
      materialId: 'custom',
      muK: Math.min(val, prev.muS),
    }));
  };

  const exportCSV = () => {
    if (chartHistory.length === 0) return;
    const header = 'Time(s),AppliedForce(N),FrictionForce(N),IsSliding\n';
    const rows = chartHistory
      .map(
        (pt) =>
          `${pt.time.toFixed(2)},${pt.appliedForce.toFixed(2)},${pt.frictionForce.toFixed(2)},${pt.isSliding}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `friction_experiment_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-3 text-xs">
      {/* 1. Applied Force Controls (Only if not hidden) */}
      {!hidePrimaryForce && (
        <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-amber-300/60 dark:border-amber-900/40 p-3.5 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              <span>{isZh ? '水平向右外力 (彈簧秤拉力)' : 'Rightward Pull Force F'}</span>
            </div>
            <button
              onClick={() => setParams((prev) => ({ ...prev, appliedForce: 0 }))}
              className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              title={isZh ? '放開彈簧秤，拉力歸零' : 'Release spring scale to 0N'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isZh ? '放開歸零 (0N)' : 'Zero (0N)'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center">
                <span>{isZh ? '向右拉力 F (0~120N):' : 'Rightward Pull F:'}</span>
                <InfoTooltip
                  title={isZh ? '水平向右外力 F' : 'Rightward Pull Force F'}
                  formula="Fnet = F - f"
                  description={
                    isZh
                      ? '由彈簧秤向右施加的外力。當 F ≤ fs,max 時靜摩擦力等大反向抵消 (合力為 0)；當 F > fs,max 時克服摩擦力，合力大於 0 開始向右加速。'
                      : 'Pull force applied by the spring scale. When F ≤ fs,max, static friction cancels it; when F > fs,max, net force accelerates block rightward.'
                  }
                />
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                {params.appliedForce} N
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={params.appliedForce}
              onChange={(e) => setParams((prev) => ({ ...prev, appliedForce: Math.max(0, parseInt(e.target.value, 10)) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Quick step buttons starting from 0 */}
          <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
            {[0, 10, 20, 30, 50].map((val) => (
              <button
                key={val}
                onClick={() => setParams((prev) => ({ ...prev, appliedForce: val }))}
                className={`py-1 rounded-lg border font-medium transition-colors ${
                  params.appliedForce === val
                    ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {val === 0 ? (isZh ? '0N(放開)' : '0N') : `${val}N`}
              </button>
            ))}
          </div>

          {/* Auto-Ramp Trigger Button */}
          {onStartAutoRamp && onStopAutoRamp && (
            <button
              onClick={isAutoRamping ? onStopAutoRamp : onStartAutoRamp}
              className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs mt-0.5 ${
                isAutoRamping
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {isAutoRamping
                  ? (isZh ? '⏹ 停止自動加力' : '⏹ Stop Auto-Ramp')
                  : (isZh ? '⚡ 一鍵平穩加力測試 (同步觀察雙圖)' : '⚡ Auto-Ramp Force Test')}
              </span>
            </button>
          )}
        </div>
      )}

      {/* 2. Material & Friction Coefficients Section */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-3.5 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
            <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>{isZh ? '表面材質與摩擦係數' : 'Surface Materials & Coefficients'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">μs ≥ μk</span>
        </div>

        {/* Material Preset Selector */}
        <div>
          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center mb-1">
            <span>{isZh ? '接觸面材料預設:' : 'Material Preset:'}</span>
            <InfoTooltip
              title={isZh ? '表面材料預設' : 'Surface Materials'}
              description={
                isZh
                  ? '不同材質的微觀粗糙度與分子引力不同，決定了靜摩擦係數 μs 與動摩擦係數 μk 的大小。'
                  : 'Different materials have varying microscopic roughness and molecular adhesion, determining μs and μk.'
              }
            />
          </label>
          <select
            value={params.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {MATERIAL_PRESETS.map((m) => (
              <option key={m.id} value={m.id}>
                {isZh ? m.nameZh : m.nameEn} (μs={m.muS.toFixed(2)}, μk={m.muK.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Sliders for muS and muK */}
        <div className="space-y-2 pt-0.5">
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center">
                <span>{isZh ? '靜摩擦係數 μs:' : 'Static Coeff μs:'}</span>
                <InfoTooltip
                  title={isZh ? '靜摩擦係數 μs' : 'Static Friction Coeff μs'}
                  formula="fs,max = μs · FN"
                  description={
                    isZh
                      ? '決定接觸面能承受的最大靜摩擦力上限。外力未超過此值前，木塊靜止且 fs = F；一旦超過即開始滑動。'
                      : 'Sets the maximum static friction threshold. Below this force, the block stays at rest and fs = F.'
                  }
                />
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                {params.muS.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max="1.20"
              step="0.01"
              value={params.muS}
              onChange={(e) => handleMuSChange(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center">
                <span>{isZh ? '動摩擦係數 μk:' : 'Kinetic Coeff μk:'}</span>
                <InfoTooltip
                  title={isZh ? '動摩擦係數 μk' : 'Kinetic Friction Coeff μk'}
                  formula="fk = μk · FN"
                  description={
                    isZh
                      ? '決定木塊滑動時的動摩擦力大小。通常 μk < μs，因為相對滑動時微觀凹凸處來不及充分咬合或形成分子冷焊。'
                      : 'Determines friction while sliding. Typically μk < μs because sliding surfaces have less time to interlock.'
                  }
                />
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {params.muK.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.00"
              max={params.muS}
              step="0.01"
              value={params.muK}
              onChange={(e) => handleMuKChange(parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Mass & Gravity Section */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-3.5 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
          <Globe2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{isZh ? '質量與重力場環境' : 'Mass & Gravitational Field'}</span>
        </div>

        {/* Mass Slider */}
        <div>
          <div className="flex justify-between items-center text-[11px] mb-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center">
              <span>{isZh ? '滑塊質量 m:' : 'Block Mass m:'}</span>
              <InfoTooltip
                title={isZh ? '滑塊質量 m' : 'Block Mass m'}
                formula="FN = m · g"
                description={
                  isZh
                    ? '質量決定下壓的正向力 (FN = m·g) 以及慣性。質量越大正向力越大，使最大靜摩擦與動摩擦成正比增加；且相同合力下加速度較小 (a = Fnet/m)。'
                    : 'Sets normal force FN and inertia. Greater mass increases friction proportionately and decreases acceleration.'
                }
              />
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {params.mass.toFixed(1)} kg
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="25.0"
            step="0.5"
            value={params.mass}
            onChange={(e) => setParams((prev) => ({ ...prev, mass: parseFloat(e.target.value) }))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Gravity Selector */}
        <div>
          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center mb-1">
            <span>{isZh ? '重力場環境 g:' : 'Gravity Environment g:'}</span>
            <InfoTooltip
              title={isZh ? '重力加速度 g' : 'Gravitational Acceleration g'}
              formula="W = m · g"
              description={
                isZh
                  ? '重力加速度決定下壓重力 (W = m·g)。在水平滑軌上正向力 FN = W，因此重力直接影響滑塊壓在桌面上的緊密程度。'
                  : 'Dictates downward weight (W = m·g) and normal force FN on the horizontal track.'
              }
            />
          </label>
          <select
            value={params.gravity}
            onChange={(e) => setParams((prev) => ({ ...prev, gravity: parseFloat(e.target.value) }))}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {GRAVITY_PRESETS.map((g) => (
              <option key={g.id} value={g.g}>
                {isZh ? g.nameZh : g.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Block Orientation */}
        <div>
          <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center mb-1">
            <span>{isZh ? '滑塊放置方向 (驗證接觸面積無關):' : 'Orientation (Contact Area Test):'}</span>
            <InfoTooltip
              title={isZh ? '接觸面積與摩擦力無關' : 'Area Independence'}
              formula="f ∝ FN (無關面積)"
              description={
                isZh
                  ? '驗證阿蒙頓第一定律：宏觀接觸面積不影響摩擦力！平放、側放或立放時，微觀真實接觸點總面積相同，摩擦力保持不變。'
                  : 'Verifies Amontons\'s Law: Friction is independent of apparent surface area. Total microscopic contact area remains unchanged.'
              }
            />
          </label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'flat', nameZh: '平放 (大)', nameEn: 'Flat (Large)' },
              { id: 'side', nameZh: '側放 (中)', nameEn: 'Side (Mid)' },
              { id: 'upright', nameZh: '立放 (小)', nameEn: 'Upright (Small)' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setParams((prev) => ({ ...prev, orientation: o.id as any }))}
                className={`py-1.5 px-2 rounded-xl text-center font-medium transition-all ${
                  params.orientation === o.id
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isZh ? o.nameZh : o.nameEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Visual Display Options */}
      <div className="bg-white/80 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-white/[0.06] p-3.5 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
          <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>{isZh ? '畫布受力標示' : 'Visual Display Options'}</span>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={visuals.showVectors}
              onChange={(e) => setVisuals((prev) => ({ ...prev, showVectors: e.target.checked }))}
              className="rounded accent-indigo-600"
            />
            <span>{isZh ? '顯示受力向量箭頭 (FN, W, F, f)' : 'Show Force Vectors (FN, W, F, f)'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={visuals.showVectorValues}
              onChange={(e) => setVisuals((prev) => ({ ...prev, showVectorValues: e.target.checked }))}
              className="rounded accent-indigo-600"
            />
            <span>{isZh ? '顯示力的大小數值標籤 (N)' : 'Show Force Value Labels'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={visuals.showNetForce}
              onChange={(e) => setVisuals((prev) => ({ ...prev, showNetForce: e.target.checked }))}
              className="rounded accent-indigo-600"
            />
            <span>{isZh ? '顯示合外力向量 (Fnet)' : 'Show Net Force Vector (Fnet)'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={visuals.showVelocityVector}
              onChange={(e) => setVisuals((prev) => ({ ...prev, showVelocityVector: e.target.checked }))}
              className="rounded accent-indigo-600"
            />
            <span>{isZh ? '顯示速度向量 (v)' : 'Show Velocity Vector (v)'}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={visuals.showParticles}
              onChange={(e) => setVisuals((prev) => ({ ...prev, showParticles: e.target.checked }))}
              className="rounded accent-indigo-600"
            />
            <span>{isZh ? '顯示滑動微觀粉塵效果' : 'Show Sliding Dust Particles'}</span>
          </label>
        </div>

        {/* Sim speed */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-slate-500 font-medium">{isZh ? '模擬播放速率:' : 'Speed:'}</span>
          <div className="flex items-center gap-1">
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setVisuals((prev) => ({ ...prev, simSpeed: s }))}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                  visuals.simSpeed === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Export Experiment Data */}
      <button
        onClick={exportCSV}
        disabled={chartHistory.length === 0}
        className="w-full py-2.5 px-3 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4 text-indigo-500" />
        <span>{isZh ? '匯出實驗數據 (CSV)' : 'Export Experiment Data (CSV)'}</span>
      </button>
    </div>
  );
};
