import { runners } from "./core/runners.mjs";
import { formFlow } from "./core/formFlow.mjs";



const time = 6 * 60 * 1000; // 1 per 6 minutes; 10 per 1 hour;

export const googleAutoForm = {
  ...runners,
  passForm: formFlow,
};
