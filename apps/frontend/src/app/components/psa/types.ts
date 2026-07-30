/**
 * @file types.ts
 * @description Type definitions for the PSA Grading Lab module.
 */

export type GradingStage = 'queue' | 'prep' | 'centering' | 'surface' | 'corners' | 'encapsulating' | 'result' | 'vault';

export interface DustSpeck {
  id: number;
  x: number;
  y: number;
  size?: 'small' | 'medium' | 'large';
  type: 'dust' | 'smudge' | 'lint' | 'fingerprint';
  cleaned: boolean;
  blowingOff?: boolean;
  blowDirectionX?: number;
  blowDirectionY?: number;
}

export interface SurfaceZone {
  id: number;
  name: string;
  label: string;
  checked: boolean;
  defectFound: boolean;
  note: string;
}

export type LabelStyle = 'standard_red' | 'gold_30th' | 'black_diamond' | 'emerald_prism';

export interface EdgeDing {
  id: string;
  edge: 'Top' | 'Right' | 'Bottom' | 'Left';
  x: number; // %
  y: number; // %
  progress: number; // 0 - 100
  repaired: boolean;
}

export interface ScuffSpot {
  id: number;
  x: number; // %
  y: number; // %
  pasted: boolean;
  buffProgress: number; // 0 - 100
  buffed: boolean;
}
