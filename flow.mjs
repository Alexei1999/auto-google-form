import puppeteer from "puppeteer";

import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { metaConfig, probabilitiesConfig } from "./constants.mjs";
import { createLoggers, mostFrequent } from "./lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = yaml.load(
  fs.readFileSync(path.resolve(__dirname, "./config.yaml"), "utf8")
);

export async function formFlow(
  flowNumber = "-",
  iterationNumber = "-",
  headless = true
) {
  const logger = createLoggers(flowNumber, iterationNumber);

  logger.info("Starting: browser");

  const browser = await puppeteer.launch({ headless });

  logger.info("Starting: page");

  const page = await browser.newPage();

  logger.finallSuccess("Started");

  try {
    await page.goto(config.formLink);

    logger.info("Form opened");

    await page.waitForSelector("form");

    const elements = await page.$$('[role="listitem"]');

    for (let i = 0; i < elements.length; i++) {
      logger.info("Process question: " + i);

      const element = elements[i];

      const items = [...(await element.$$("label"))];

      const probabilities = probabilitiesConfig[i + 1];
      const meta = metaConfig[i + 1];

      if (meta && meta.ignoreLast) {
        items.pop();
      }

      if (!items.length) {
        continue;
      }

      const averageProbability = 100 / items.length;
      const random = Math.floor(Math.random() * 100);

      logger.info("Random: " + random);

      let minRightProbability = null;
      let maxLeftProbability = null;
      let choiced = false;
      let choiceNumber = 0;

      const repeates = {};

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        const probability = probabilities && probabilities[j + 1];

        const clickItem = async () => {
          await item.click();
          await new Promise((r) => setTimeout(r, 300));
        };

        let targetProbability =
          typeof probability !== "number" ? averageProbability : probability;

        debugger;

        if (!repeates[targetProbability]) {
          repeates[targetProbability] = 1;
        } else {
          repeates[targetProbability] = repeates[targetProbability] + 1;
        }

        targetProbability = targetProbability * repeates[targetProbability];

        if (
          targetProbability >= random &&
          (minRightProbability === null ||
            targetProbability < minRightProbability)
        ) {
          minRightProbability = targetProbability;

          if (targetProbability !== random) {
            await clickItem();

            choiced = true;
            choiceNumber = j;
          }

          continue;
        }

        if (
          targetProbability <= random &&
          (maxLeftProbability === null ||
            targetProbability > maxLeftProbability)
        ) {
          maxLeftProbability = targetProbability;

          if (!choiced && targetProbability !== random) {
            await clickItem();

            choiceNumber = j;
            continue;
          }
        }

        if (!choiced) {
          await clickItem();
          choiceNumber = j;
        }
      }

      logger.success("Option clicked: " + choiceNumber);
    }

    logger.success("Form filled");

    const buttons = await page.$$('[role="button"]');
    await buttons[27].click();

    await page.waitForNavigation({ waitUntil: "networkidle0" });

    logger.finallSuccess("Form finished");
  } catch (error) {
    logger.error(error.message);

    throw error;
  } finally {
    await browser.close();
  }
}

export const runFlowSeries = async (howMuch, divider = 25) => {
  const iterations = Math.ceil(howMuch / divider);
  const launches = Math.ceil(howMuch / iterations);

  for (let iteration of Array(iterations).keys()) {
    console.log(`Iteration number: ${iteration}`);

    await Promise.allSettled(
      [...Array(launches).keys()].map((i) =>
        formFlow(`${i}/${launches - 1}`, `${iteration}/${iterations - 1}`)
      )
    ).then((results) => {
      const rejectedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(`Number of rejected promises: ${rejectedCount}`);
    });
  }
};
