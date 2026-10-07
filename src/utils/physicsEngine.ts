import { PhysicsParams, SimulationState, FrictionStateType } from '../types/physics';

export const TRACK_LIMIT_MIN = -7.5; // meters
export const TRACK_LIMIT_MAX = 5.5; // meters (wall boundary)

export function computePhysicsStep(
  prevState: SimulationState,
  params: PhysicsParams,
  dt: number
): { nextState: SimulationState; staticFrictionBreakOccurred: boolean; hitRightWall: boolean } {
  const { mass, gravity, muS, muK, appliedForce } = params;
  
  // On a horizontal track: Normal force FN = m * g
  const normalForce = Math.max(0, mass * gravity);
  const maxStaticFriction = muS * normalForce;
  const kineticFrictionMag = muK * normalForce;
  
  // Driving external force along horizontal surface (positive = right, negative = left)
  const drivingForce = appliedForce;
  
  let frictionForce = 0;
  let netForce = 0;
  let acceleration = 0;
  let nextVelocity = prevState.velocity;
  let isSliding = prevState.isSliding;
  let stateType: FrictionStateType = 'static_rest';
  let staticFrictionBreakOccurred = false;
  
  const VELOCITY_THRESHOLD = 0.0001;
  const currentlyAtRest = Math.abs(prevState.velocity) < VELOCITY_THRESHOLD;
  
  if (currentlyAtRest) {
    // Currently at rest
    if (Math.abs(drivingForce) <= maxStaticFriction) {
      // Static friction exactly balances external applied force: f = -F
      frictionForce = -drivingForce;
      netForce = 0;
      acceleration = 0;
      nextVelocity = 0;
      isSliding = false;
      
      const ratio = maxStaticFriction > 0 ? Math.abs(drivingForce) / maxStaticFriction : 0;
      stateType = ratio >= 0.95 && maxStaticFriction > 0.01 ? 'impending_slip' : 'static_rest';
    } else {
      // STATIC FRICTION BROKEN! Transition to kinetic sliding
      staticFrictionBreakOccurred = true;
      isSliding = true;
      stateType = 'kinetic_sliding';
      
      const slipDirection = Math.sign(drivingForce) || 1;
      frictionForce = -slipDirection * kineticFrictionMag;
      netForce = drivingForce + frictionForce;
      acceleration = mass > 0 ? netForce / mass : 0;
      nextVelocity = acceleration * dt;
    }
  } else {
    // Currently in motion with non-zero velocity
    const motionDir = Math.sign(prevState.velocity);
    frictionForce = -motionDir * kineticFrictionMag;
    netForce = drivingForce + frictionForce;
    acceleration = mass > 0 ? netForce / mass : 0;
    
    // Euler-Cromer integration
    const tentativeVelocity = prevState.velocity + acceleration * dt;
    
    // Check if motion stops during this timestep
    if (Math.sign(tentativeVelocity) !== motionDir && tentativeVelocity !== 0) {
      // Velocity crossed zero (decelerated to stop)
      if (Math.abs(drivingForce) <= maxStaticFriction) {
        // Latches into static rest!
        nextVelocity = 0;
        acceleration = 0;
        frictionForce = -drivingForce;
        netForce = 0;
        isSliding = false;
        stateType = 'static_rest';
      } else {
        // Reverses direction immediately
        nextVelocity = tentativeVelocity;
        isSliding = true;
        stateType = 'kinetic_sliding';
      }
    } else {
      nextVelocity = tentativeVelocity;
      isSliding = true;
      stateType = Math.abs(acceleration) < 0.01 ? 'kinetic_sliding' : (Math.sign(acceleration) !== motionDir ? 'decelerating' : 'kinetic_sliding');
    }
  }
  
  // Position integration
  let nextPosition = prevState.position + 0.5 * (prevState.velocity + nextVelocity) * dt;
  
  let hitRightWall = false;

  // Boundary bounds: hitting right wall stops motion and triggers stop/pause
  if (nextPosition >= TRACK_LIMIT_MAX) {
    nextPosition = TRACK_LIMIT_MAX;
    nextVelocity = 0;
    acceleration = 0;
    frictionForce = 0;
    netForce = 0;
    isSliding = false;
    stateType = 'static_rest';
    hitRightWall = true;
  } else if (nextPosition < TRACK_LIMIT_MIN) {
    nextPosition = TRACK_LIMIT_MIN;
    if (nextVelocity < 0) {
      nextVelocity = 0;
    }
  }
  
  // Work & Energy calculations
  const deltaX = nextPosition - prevState.position;
  const powerDissipated = Math.abs(frictionForce * ((prevState.velocity + nextVelocity) / 2));
  const addedThermal = isSliding ? powerDissipated * dt : 0;
  const addedWork = appliedForce * deltaX;
  const kineticEnergy = 0.5 * mass * nextVelocity * nextVelocity;
  
  return {
    nextState: {
      time: prevState.time + dt,
      position: nextPosition,
      velocity: nextVelocity,
      acceleration,
      appliedForce,
      normalForce,
      maxStaticFriction,
      kineticFrictionMag,
      frictionForce,
      netForce,
      isSliding,
      stateType,
      hitRightWall,
      thermalEnergy: prevState.thermalEnergy + addedThermal,
      workApplied: prevState.workApplied + addedWork,
      kineticEnergy,
    },
    staticFrictionBreakOccurred,
    hitRightWall,
  };
}

export function calculateStaticFrictionAtRest(
  drivingForce: number,
  normalForce: number,
  muS: number
): { friction: number; isSlipping: boolean } {
  const maxFs = muS * normalForce;
  if (Math.abs(drivingForce) <= maxFs) {
    return { friction: -drivingForce, isSlipping: false };
  }
  return { friction: -Math.sign(drivingForce) * maxFs, isSlipping: true };
}
