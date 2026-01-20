import { startSessionCleanupCron } from '../utils/cleanup-sessions';

export default defineNitroPlugin(() => {
  startSessionCleanupCron();
});
