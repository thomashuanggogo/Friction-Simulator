/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ViewTab,
  PhysicsParams,
  SimulationState,
  VisualSettings,
  ForceChartPoint,
  KinematicPoint,
} from './types/physics';
import { computePhysicsStep } from './utils/physicsEngine';
import { soundManager } from './utils/soundEffects';
import { Header } from './components/Header';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ForceDiagramChart } from './components/ForceDiagramChart';
import { KinematicsCharts } from './components/KinematicsCharts';
import { ControlsPanel } from './components/ControlsPanel';
import { MicroscopicView } from './components/MicroscopicView';
import { TheoryModal } from './components/TheoryModal';

const INITIAL_PARAMS: PhysicsParams = {
  mass: 5.0, // kg
  gravity: 9.80, // m/s^2
  muS: 0.50, // static coeff
  muK: 0.35, // kinetic coeff
  orientation: 'flat',
  materialId: 'wood_wood',
  appliedForce: 0,
};

const INITIAL_STATE: SimulationState = {
  time: 0,
  position: -6.0,
  velocity: 0,
  acceleration: 0,
  appliedForce: 0,
  normalForce: 49.0,
  maxStaticFriction: 24.5,
  kineticFrictionMag: 17.15,
  frictionForce: 0,
  netForce: 0,
  isSliding: false,
  stateType: 'static_rest',
  thermalEnergy: 0,
  workApplied: 0,
  kineticEnergy: 0,
};

const INITIAL_VISUALS: VisualSettings = {
  showVectors: true,
  showVectorValues: true,
  showNetForce: false,
  showVelocityVector: true,
  showAccelerationVector: false,
  showRuler: true,
  showParticles: true,
  soundEnabled: true,
  simSpeed: 1.0,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('simulation');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isAutoRamping, setIsAutoRamping] = useState<boolean>(false);
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [autoStop, setAutoStop] = useState<boolean>(true);

  const [params, setParams] = useState<PhysicsParams>(INITIAL_PARAMS);
  const [state, setState] = useState<SimulationState>(INITIAL_STATE);
  const [visuals, setVisuals] = useState<VisualSettings>(INITIAL_VISUALS);

  const [forceHistory, setForceHistory] = useState<ForceChartPoint[]>([]);
  const [kinematicHistory, setKinematicHistory] = useState<KinematicPoint[]>([]);

  const lastTimeRef = useRef<number>(performance.now());
  const rampStartFsMaxRef = useRef<number>(0);
  const paramsRef = useRef<PhysicsParams>(params);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const isAutoRampingRef = useRef<boolean>(isAutoRamping);
  const visualsRef = useRef<VisualSettings>(visuals);
  const timeLimitRef = useRef<number>(timeLimit);
  const autoStopRef = useRef<boolean>(autoStop);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    isAutoRampingRef.current = isAutoRamping;
  }, [isAutoRamping]);
  useEffect(() => {
    timeLimitRef.current = timeLimit;
  }, [timeLimit]);
  useEffect(() => {
    autoStopRef.current = autoStop;
  }, [autoStop]);
  useEffect(() => {
    visualsRef.current = visuals;
    soundManager.setEnabled(visuals.soundEnabled);
  }, [visuals]);

  // Handle applied force change from canvas dragging or controls (>= 0 N)
  const handleForceChange = useCallback((newForce: number) => {
    setParams((prev) => ({ ...prev, appliedForce: Math.max(0, Math.min(120, newForce)) }));
  }, []);

  // Reset simulation position & kinematics
  const handleReset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      time: 0,
      position: -6.0,
      velocity: 0,
      acceleration: 0,
      frictionForce: 0,
      netForce: 0,
      isSliding: false,
      stateType: 'static_rest',
      thermalEnergy: 0,
      workApplied: 0,
      kineticEnergy: 0,
    }));
    setParams((prev) => ({ ...prev, appliedForce: 0 }));
    setForceHistory([]);
    setKinematicHistory([]);
    setIsAutoRamping(false);
    soundManager.stopScraping();
  }, []);

  // Restart timing run from 0 seconds (returns block to -6.0m starting line)
  const handleRestartTiming = useCallback(() => {
    setState((prev) => ({
      ...prev,
      time: 0,
      position: -6.0,
      velocity: 0,
      acceleration: 0,
      isSliding: false,
      stateType: 'static_rest',
    }));
    setKinematicHistory([]);
    setIsPlaying(true);
  }, []);

  // Toggle play/pause (if at or past time limit or hit right wall, restart fresh run from -6.0m)
  const handleTogglePlay = useCallback(() => {
    if (!isPlayingRef.current && (state.hitRightWall || (autoStopRef.current && state.time >= timeLimitRef.current))) {
      handleRestartTiming();
    } else {
      setIsPlaying((p) => !p);
    }
  }, [state.time, state.hitRightWall, handleRestartTiming]);

  // Reset block to starting position -6.0m
  const handleResetPosition = useCallback(() => {
    setState((prev) => ({
      ...prev,
      position: -6.0,
      velocity: 0,
      acceleration: 0,
    }));
    soundManager.stopScraping();
  }, []);

  // Auto ramp testing trigger
  const handleStartAutoRamp = useCallback(() => {
    setIsAutoRamping(true);
    setIsPlaying(true);
    setParams((prev) => ({ ...prev, appliedForce: 0 }));
    rampStartFsMaxRef.current = paramsRef.current.muS * paramsRef.current.mass * paramsRef.current.gravity;
  }, []);

  const handleStopAutoRamp = useCallback(() => {
    setIsAutoRamping(false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setParams((prev) => ({ ...prev, appliedForce: Math.min(120, prev.appliedForce + 2) }));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setParams((prev) => ({ ...prev, appliedForce: Math.max(0, prev.appliedForce - 2) }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleTogglePlay]);

  // Main Simulation Loop
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const deltaMs = Math.min(64, now - lastTimeRef.current);
      lastTimeRef.current = now;

      if (isPlayingRef.current) {
        // Stop timing if limit is reached
        if (autoStopRef.current && state.time >= timeLimitRef.current) {
          setIsPlaying(false);
          soundManager.stopScraping();
          animId = requestAnimationFrame(tick);
          return;
        }

        const dt = (deltaMs / 1000) * visualsRef.current.simSpeed;

        // Auto-ramp logic
        if (isAutoRampingRef.current) {
          const rampRate = 14; // Newtons per second
          const nextForce = paramsRef.current.appliedForce + rampRate * dt;
          const cutoff = Math.max(30, (rampStartFsMaxRef.current || 30) * 1.35);

          if (nextForce >= cutoff) {
            setParams((prev) => ({ ...prev, appliedForce: Math.round(cutoff) }));
            setIsAutoRamping(false);
          } else {
            setParams((prev) => ({ ...prev, appliedForce: nextForce }));
          }
        }

        // Physics step calculation (pure horizontal model)
        setState((prevState) => {
          if (autoStopRef.current && prevState.time >= timeLimitRef.current) {
            setIsPlaying(false);
            soundManager.stopScraping();
            return prevState;
          }

          const { nextState, staticFrictionBreakOccurred } = computePhysicsStep(
            prevState,
            paramsRef.current,
            dt
          );

          // Auto stop when crossing time limit or hitting right wall
          if (nextState.hitRightWall || (autoStopRef.current && nextState.time >= timeLimitRef.current)) {
            if (autoStopRef.current && nextState.time >= timeLimitRef.current) {
              nextState.time = timeLimitRef.current;
            }
            setIsPlaying(false);
            soundManager.stopScraping();
            if (nextState.hitRightWall) {
              soundManager.playLatchSound();
            }
          }

          // Audio triggers
          if (staticFrictionBreakOccurred) {
            soundManager.playBreakSound();
          }
          soundManager.updateMotionScrape(nextState.velocity, nextState.isSliding);

          // Append to history trails
          const drivingF = Math.abs(paramsRef.current.appliedForce);
          const fricF = Math.abs(nextState.frictionForce);

          setForceHistory((prev) => {
            const last = prev[prev.length - 1];
            if (!last || Math.abs(last.appliedForce - drivingF) > 0.3 || Math.abs(last.frictionForce - fricF) > 0.3) {
              const nextHist = [...prev, { appliedForce: drivingF, frictionForce: fricF, isSliding: nextState.isSliding, time: nextState.time }];
              return nextHist.length > 500 ? nextHist.slice(-500) : nextHist;
            }
            return prev;
          });

          setKinematicHistory((prev) => {
            const nextHist = [...prev, { time: nextState.time, x: nextState.position, v: nextState.velocity, a: nextState.acceleration }];
            return nextHist.length > 400 ? nextHist.slice(-400) : nextHist;
          });

          return nextState;
        });
      } else {
        soundManager.stopScraping();
      }

      animId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      soundManager.stopScraping();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header & Nav */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        setIsPlaying={handleTogglePlay}
        onReset={handleReset}
        lang={lang}
        setLang={setLang}
        soundEnabled={visuals.soundEnabled}
        setSoundEnabled={(val) => setVisuals((prev) => ({ ...prev, soundEnabled: val }))}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto w-full p-3 sm:p-4 flex-1 flex flex-col gap-4">
        {/* VIEW TAB 1: Main Simulation & Curves */}
        {activeTab === 'simulation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 8 columns: Canvas + Real-Time Charts */}
            <div className="lg:col-span-8 flex flex-col gap-3.5">
              {/* Physics Simulation Canvas */}
              <SimulationCanvas
                state={state}
                params={params}
                visuals={visuals}
                lang={lang}
                onForceChange={handleForceChange}
                onResetPosition={handleResetPosition}
              />

              {/* Data & Curves Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Real-time F-f Characteristic Curve */}
                <ForceDiagramChart
                  state={state}
                  params={params}
                  history={forceHistory}
                  lang={lang}
                  onClearHistory={() => setForceHistory([])}
                  isAutoRamping={isAutoRamping}
                  onStartAutoRamp={handleStartAutoRamp}
                  onStopAutoRamp={handleStopAutoRamp}
                />

                {/* Real-time Acceleration vs. Time (a-t) Diagram */}
                <KinematicsCharts
                  state={state}
                  history={kinematicHistory}
                  lang={lang}
                  timeLimit={timeLimit}
                  setTimeLimit={setTimeLimit}
                  autoStop={autoStop}
                  setAutoStop={setAutoStop}
                  onRestartTiming={handleRestartTiming}
                />
              </div>
            </div>

            {/* Right 4 columns: Physics Controls & Parameters Panel */}
            <div className="lg:col-span-4">
              <ControlsPanel
                params={params}
                setParams={setParams}
                state={state}
                visuals={visuals}
                setVisuals={setVisuals}
                lang={lang}
                chartHistory={forceHistory}
                isAutoRamping={isAutoRamping}
                onStartAutoRamp={handleStartAutoRamp}
                onStopAutoRamp={handleStopAutoRamp}
              />
            </div>
          </div>
        )}

        {/* VIEW TAB 2: Microscopic View */}
        {activeTab === 'microscopic' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8">
              <MicroscopicView state={state} params={params} lang={lang} />
            </div>
            <div className="lg:col-span-4">
              <ControlsPanel
                params={params}
                setParams={setParams}
                state={state}
                visuals={visuals}
                setVisuals={setVisuals}
                lang={lang}
                chartHistory={forceHistory}
                isAutoRamping={isAutoRamping}
                onStartAutoRamp={handleStartAutoRamp}
                onStopAutoRamp={handleStopAutoRamp}
              />
            </div>
          </div>
        )}

        {/* Theory Modal Reference */}
        <TheoryModal
          isOpen={isTheoryOpen}
          onClose={() => setIsTheoryOpen(false)}
          lang={lang}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <p>
          {lang === 'zh'
            ? '摩擦力互動模擬器 · 高一基礎物理（水平滑軌受力分析、F-f 特徵圖、a-t 關係圖）'
            : 'Friction Physics Simulator · High School Physics Fundamentals'}
        </p>
      </footer>
    </div>
  );
}
