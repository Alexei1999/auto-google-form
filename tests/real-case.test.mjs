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

// 10 tests per hour
const time = 6 * 60 * 1000;

googleAutoForm.runPeriodic(configs, 278, time, {
  shutdownRanges: () => {
    const dayjsRes = dayjs().minute(0).second(0);

    return [
      dayjsRes.hour(0),
      dayjsRes.hour(8),
      dayjsRes.hour(20),
      dayjsRes.hour(24),
    ];
  },
});
