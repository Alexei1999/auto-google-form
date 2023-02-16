import { runFlowSeries } from "./flow.mjs";
// import { formFlow } from "./flow.mjs";
// formFlow(0, 0, false);

process.setMaxListeners(0);

const howMuch = 100;

runFlowSeries(howMuch);
