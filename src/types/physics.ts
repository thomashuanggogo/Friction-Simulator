export type ViewTab = 'simulation' | 'microscopic' | 'theory';

export type BlockOrientation = 'flat' | 'side' | 'upright';

export type ForceControlMode = 'manual' | 'auto_ramp' | 'sine';

export interface MaterialPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  muS: number;
  muK: number;
  descriptionZh: string;
  descriptionEn: string;
  color: string;
  blockColor: string;
  surfacePattern: 'wood' | 'ice' | 'rubber' | 'steel' | 'teflon' | 'sandpaper' | 'custom';
}

export interface GravityPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  g: number;
}

export type FrictionStateType =
  | 'static_rest'
  | 'impending_slip'
  | 'kinetic_sliding'
  | 'decelerating';

export interface SimulationState {
  time: number;
  position: number; // in meters (-10 to 10)
  velocity: number; // in m/s
  acceleration: number; // in m/s^2
  appliedForce: number; // in N (positive = right, negative = left)
  
  // Computed forces (magnitudes & signed components)
  normalForce: number; // F_N = m * g (N)
  maxStaticFriction: number; // f_{s,max} = mu_s * F_N (N)
  kineticFrictionMag: number; // f_k = mu_k * F_N (N)
  frictionForce: number; // f (N, signed along surface)
  netForce: number; // F_net = F + f (N, signed along surface)
  
  isSliding: boolean;
  stateType: FrictionStateType;
  hitRightWall?: boolean;
  
  // Work & Energy
  thermalEnergy: number; // Joules (heat dissipated by kinetic friction)
  workApplied: number; // Joules (work done by external force)
  kineticEnergy: number; // Joules (0.5 * m * v^2)
}

export interface PhysicsParams {
  mass: number; // kg
  gravity: number; // m/s^2
  muS: number; // static friction coefficient
  muK: number; // kinetic friction coefficient
  orientation: BlockOrientation;
  materialId: string;
  appliedForce: number; // current target external force (N)
}

export interface ForceChartPoint {
  appliedForce: number;
  frictionForce: number;
  isSliding: boolean;
  time: number;
}

export interface KinematicPoint {
  time: number;
  x: number;
  v: number;
  a: number;
}

export interface VisualSettings {
  showVectors: boolean;
  showVectorValues: boolean;
  showNetForce: boolean;
  showVelocityVector: boolean;
  showAccelerationVector: boolean;
  showRuler: boolean;
  showParticles: boolean;
  soundEnabled: boolean;
  simSpeed: number; // 0.25, 0.5, 1.0, 2.0
}
