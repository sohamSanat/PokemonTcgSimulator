/**
 * @file gradingLogic.ts
 * @description Pure functions and algorithms for PSA grading calculations, dust speck generation, and scoring math.
 */

import type { Card } from '../binder/types';
import type { DustSpeck, SurfaceZone } from './types';

export interface GradingResult {
 centeringScore: number;
 surfaceScore: number;
 cornersScore: number;
 edgesScore: number;
 gradeNum: number;
 multiplier: number;
}

/**
 * Calculates the randomized subgrades, final grade, and value multiplier for a given card.
 * Handles restored card odds vs raw card odds.
 * 
 * @param card - The raw card being graded.
 * @param forcedTargetGrade - Optional demo override to guarantee a specific grade.
 * @param isRestoredBoosted - Whether the card recently passed the restoration studio.
 */
export function calculateGrades(card: Card, forcedTargetGrade?: number, isRestoredBoosted?: boolean): GradingResult {
 let centeringScore = 10;
 let surfaceScore = 10;
 let cornersScore = 10;
 let edgesScore = 10;
 let gradeNum = 10;
 let multiplier = 3.2;

 if (forcedTargetGrade !== undefined) {
 gradeNum = forcedTargetGrade;
 if (gradeNum === 10) { centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10; multiplier = 3.2; }
 else if (gradeNum === 9) { centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0; multiplier = 1.8; }
 else if (gradeNum === 8) { centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.5; multiplier = 1.25; }
 else if (gradeNum === 7) { centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.5; multiplier = 1.05; }
 return { centeringScore, surfaceScore, cornersScore, edgesScore, gradeNum, multiplier };
 }

 if (isRestoredBoosted || card.isRestored) {
 // Restored card odds: PSA 7 (25%), PSA 8 (25%), PSA 9 (30%), PSA 10 (20%)
 const rand = Math.random();
 const randSub = Math.random();

 if (rand < 0.25) {
 gradeNum = 7;
 centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.0 + (randSub > 0.5 ? 0.5 : 0);
 multiplier = 1.05 + randSub * 0.1;
 } else if (rand < 0.50) {
 gradeNum = 8;
 centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.0 + (randSub > 0.5 ? 0.5 : 0);
 multiplier = 1.25 + randSub * 0.15;
 } else if (rand < 0.80) {
 gradeNum = 9;
 centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0 + (randSub > 0.5 ? 0.5 : 0);
 multiplier = 1.8 + randSub * 0.2;
 } else {
 gradeNum = 10;
 centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10;
 multiplier = 3.0 + randSub * 0.5;
 }
 } else {
 // Unrestored raw odds: PSA 5 (10%), PSA 6 (15%), PSA 7 (25%), PSA 8 (30%), PSA 9 (15%), PSA 10 (5%)
 const rand = Math.random();
 const randSub = Math.random();

 if (rand < 0.10) {
 gradeNum = 5;
 centeringScore = 5.5; surfaceScore = 5.0; cornersScore = 5.5; edgesScore = 5.0;
 multiplier = 0.8;
 } else if (rand < 0.25) {
 gradeNum = 6;
 centeringScore = 6.5; surfaceScore = 6.0; cornersScore = 6.5; edgesScore = 6.0;
 multiplier = 0.9;
 } else if (rand < 0.50) {
 gradeNum = 7;
 centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.0;
 multiplier = 1.05;
 } else if (rand < 0.80) {
 gradeNum = 8;
 centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.0;
 multiplier = 1.25;
 } else if (rand < 0.95) {
 gradeNum = 9;
 centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0;
 multiplier = 1.8;
 } else {
 gradeNum = 10;
 centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10;
 multiplier = 3.2;
 }
 }

 return { centeringScore, surfaceScore, cornersScore, edgesScore, gradeNum, multiplier };
}

/**
 * Generates an array of randomized dust specks and smudges based on the surface score.
 * Lower surface score = more dust and smudges to clean.
 */
export function generateDustSpecks(surfaceScore: number): DustSpeck[] {
 const speckCount = surfaceScore < 8.0 ? 15 : surfaceScore < 9.5 ? 8 : 4;
 const generatedSpecks: DustSpeck[] = [];
 
 for (let i = 0; i < speckCount; i++) {
 const isSmudge = Math.random() > 0.7;
 generatedSpecks.push({
 id: Date.now() + i,
 x: 10 + Math.random() * 80,
 y: 10 + Math.random() * 80,
 size: isSmudge ? 'large' : Math.random() > 0.5 ? 'medium' : 'small',
 type: isSmudge ? (Math.random() > 0.5 ? 'smudge' : 'fingerprint') : (Math.random() > 0.5 ? 'dust' : 'lint'),
 cleaned: false
 });
 }
 return generatedSpecks;
}

/**
 * Initializes the surface zone inspection checklist based on the surface score.
 */
export function initializeSurfaceZones(surfaceScore: number): SurfaceZone[] {
 return [
 {
 id: 1,
 name: 'Top Holofoil Header Zone',
 label: 'Top Header & Title Foil Sheen',
 checked: false,
 defectFound: surfaceScore < 9.5,
 note: surfaceScore < 9.5 ? 'Minor foil clouding / micro-scratch (-0.5 pt)' : 'Flawless mirror gloss reflection '
 },
 {
 id: 2,
 name: 'Center Artwork Texture Zone',
 label: 'Character Illustration & Etching',
 checked: false,
 defectFound: surfaceScore < 8.5,
 note: surfaceScore < 8.5 ? 'Factory print line detected across art (-1.0 pt)' : 'Crisp illustration emboss & clarity '
 },
 {
 id: 3,
 name: 'Bottom Border & Gloss Zone',
 label: 'Text Box & Lower Frame Integrity',
 checked: false,
 defectFound: surfaceScore < 7.5,
 note: surfaceScore < 7.5 ? 'Surface scuff / loss of gloss finish (-1.5 pt)' : 'Immaculate lower gloss & text boundary '
 }
 ];
}
