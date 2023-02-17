import { runners } from "./core/runners.mjs";
import { formFlow } from "./core/formFlow.mjs";

export const googleAutoForm = {
  ...runners,
  passForm: formFlow,
};
