import React from 'react';
import { X, BookOpen, ExternalLink, Lightbulb, Check } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'zh' | 'en';
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;
  const isZh = lang === 'zh';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col gap-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isZh ? '摩擦力物理原理與公式手冊' : 'Friction Physics Reference & Formulas'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isZh ? '高中物理力學核心觀念手冊' : 'High School Mechanics Core Concepts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Principles Content */}
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          {/* Section 1: Amontons-Coulomb Laws */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <span>§ 1. 阿蒙頓-庫侖摩擦定律 (Coulomb's Friction Laws)</span>
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>第一定律：</strong>摩擦力的大小與接觸面正向力 $F_N$ 成正比：
                <span className="font-mono ml-1 font-bold text-slate-900 dark:text-slate-100">f ∝ FN</span>
              </li>
              <li>
                <strong>第二定律：</strong>摩擦力的大小與接觸面的<strong>宏觀表面積無關</strong>（平放或立放摩擦力相同）。
              </li>
              <li>
                <strong>第三定律：</strong>動摩擦力的大小幾乎與<strong>滑動速度無關</strong>（在一般中低速範圍內）。
              </li>
            </ul>
          </div>

          {/* Section 2: Formulas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20">
              <div className="font-bold text-rose-700 dark:text-rose-300 text-xs mb-1">
                {isZh ? '最大靜摩擦力 (Max Static Friction)' : 'Max Static Friction'}
              </div>
              <div className="font-mono text-base font-bold text-rose-800 dark:text-rose-200 my-1">
                fs,max = μs · FN
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {isZh
                  ? '當外力 F 未達 fs,max 前，物體保持靜止，靜摩擦力隨外力被動調適：fs = -F。直到 F 突破 fs,max 物體才開始滑動。'
                  : 'Before F reaches fs,max, the object stays at rest with fs = -F. Once F exceeds fs,max, sliding commences.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
              <div className="font-bold text-blue-700 dark:text-blue-300 text-xs mb-1">
                {isZh ? '動摩擦力 (Kinetic Friction)' : 'Kinetic Friction'}
              </div>
              <div className="font-mono text-base font-bold text-blue-800 dark:text-blue-200 my-1">
                fk = μk · FN
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {isZh
                  ? '滑動過程中方向永遠逆著相對滑動速度。通常 μk < μs，因此一旦啟動滑動，阻力會突然驟降，導致物體產生瞬間加速度（黏滯-滑動現象）。'
                  : 'Opposes sliding velocity. Typically μk < μs, so force drops once motion begins, giving a sudden acceleration.'}
              </p>
            </div>
          </div>

          {/* Section 3: Horizontal Mechanics & Newton's 2nd Law */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1.5 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <span>§ 2. 水平面受力平衡與牛頓第二定律 (Newton's 2nd Law)</span>
            </h3>
            <p className="leading-relaxed mb-2">
              {isZh
                ? '在水平面上，垂直方向重力與正向力相互抵消平衡：FN = mg。水平方向則遵循：'
                : 'On a horizontal surface, vertical gravity balances normal force: FN = mg. Horizontally:'}
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-center mb-2">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border text-[11px]">
                {isZh ? '靜止時 (F ≤ fs,max): f = -F, a = 0' : 'At rest: f = -F, a = 0'}
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border text-[11px]">
                {isZh ? '滑動時 (F > fs,max): fk = μk·mg' : 'Sliding: fk = μk·mg'}
              </div>
            </div>
            <p className="leading-relaxed">
              {isZh
                ? '滑動時物體的加速度 a 完全由合外力 Fnet 決定（即 a-t 圖的物理意義）：'
                : 'The acceleration a is determined by the net driving force:'}
            </p>
            <div className="p-2 my-1 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 font-mono text-center font-bold text-indigo-800 dark:text-indigo-300">
              Fnet = F - fk = m · a ⟹ a = (F - fk) / m
            </div>
          </div>

          {/* Section 4: Insight */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                {isZh ? '物理思維思考：摩擦力一定阻礙物體運動嗎？' : 'Physics Insight: Does friction always resist motion?'}
              </h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                {isZh
                  ? '許多同學誤以為摩擦力永遠是「阻力」。但實際上：人在地面走路時，腳底向後蹬地，地面的靜摩擦力向前，摩擦力正是讓人向前推進的「動力」！摩擦力阻礙的是「相對運動趨勢」，而非物體相對於地面的運動。'
                  : 'Friction does not always oppose absolute motion—it opposes relative motion between contact surfaces. For example, when walking, static friction pushes you forward!'}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
          >
            {isZh ? '關閉手冊' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
