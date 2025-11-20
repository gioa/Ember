export enum AppState {
  WRITING = 'WRITING',
  BURNING = 'BURNING',
  COMPLETED = 'COMPLETED'
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export interface BurningConfig {
  duration: number;
}