import {
  isDataResetEnabled,
  getLastResetTime,
  getNextResetTime,
  getDataResetIntervalMs
} from '../../utils/data-reset';

export default defineEventHandler(() => {
  return {
    enabled: isDataResetEnabled(),
    intervalMs: getDataResetIntervalMs(),
    lastResetTime: getLastResetTime(),
    nextResetTime: getNextResetTime()
  };
});
