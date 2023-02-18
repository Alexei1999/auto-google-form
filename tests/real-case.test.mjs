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

const time = 6 * 60 * 1000;

const dateFrom = dayjs().set("hour", 18).startOf("minute").startOf("second");
const dateTo = dayjs()
  .add(1, "day")
  .set("hour", 10)
  .endOf("minute")
  .endOf("second");

googleAutoForm.runPeriodic(configs, 278, time, {
  shutdownRange: () => [dateFrom, dateTo],
});
