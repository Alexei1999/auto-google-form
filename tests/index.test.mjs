import { googleAutoForm } from "../src/index.mjs";
import {
  scatteringValue,
  probabilitiesConfig,
  processConfig,
} from "./config.mjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import dayjs from "dayjs";

process.setMaxListeners(0);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = yaml.load(
  fs.readFileSync(path.resolve(__dirname, "./config.yaml"), "utf8")
);

const configs = {
  varConfig: config,
  scatteringValue,
  probabilitiesConfig,
  processConfig,
};

// "passForm should work correctly",
googleAutoForm.passForm({ ...configs, headless: false });

// "runSeries should work correctly"
googleAutoForm.runSeries(configs, 10, 5);

// "runPeriodic should work correctly"
const time = 1 * 60 * 1000;

googleAutoForm.runPeriodic(configs, 5, time, {
  shutdownRange: () => [
    dayjs().startOf("minute").startOf("second"),
    dayjs().add(1, "minute"),
  ],
});
