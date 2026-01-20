import { startDataResetCron } from '../utils/data-reset';

export default defineNitroPlugin(() => {
  startDataResetCron();
});
