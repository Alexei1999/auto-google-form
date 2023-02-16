import { runFlowSeries } from "./flow.mjs";
// import { formFlow } from "./flow.mjs";

process.setMaxListeners(0);

// formFlow();

const howMuch = 100;

runFlowSeries(howMuch);
