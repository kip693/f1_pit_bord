
import { sessionsApi } from './sessions';
import { meetingsApi } from './meetings';
import { driversApi } from './drivers';
import { lapsApi } from './laps';
import { pitApi } from './pit';
import { positionsApi } from './positions';
import { stintsApi } from './stints';
import * as raceControlApi from './raceControl';
import { carData } from './carData';
import { location } from './location';

export * from '../types';

// 統合APIオブジェクト
export const f1Api = {
  sessions: sessionsApi,
  meetings: meetingsApi,
  drivers: driversApi,
  laps: lapsApi,
  pit: pitApi,
  positions: positionsApi,
  stints: stintsApi,
  raceControl: raceControlApi,
  carData: carData,
  location: location,
};
