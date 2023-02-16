import puppeteer from "puppeteer";

import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  metaConfig,
  probabilitiesConfig,
  randomScattering,
} from "./constants.mjs";
import { createLoggers } from "./lib.mjs";

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

      const probabilities = probabilitiesConfig[i + 1];
      const meta = metaConfig[i + 1];
      const element = elements[i];

      const items = [...(await element.$$("label"))];

      if (meta && meta.ignoreLast) {
        items.pop();
      }

      if (!items.length) {
        continue;
      }

      const averageProbability =
        100 /
        (items.filter((_, i) => !probabilities[i]).length || items.length);
      const random = Math.floor(Math.random() * 100);

      logger.info("Random: " + random);

      let mappedItems = [...items].map((item, j) => {
        const probability = probabilities && probabilities[j + 1];

        const targetProbability =
          typeof probability !== "number" ? averageProbability : probability;

        return {
          item,
          probability: targetProbability,
        };
      });

      if (!meta?.fixedProb && mappedItems.length > 1) {
        for (let i = 0; i < mappedItems.length; i++) {
          if (i === mappedItems.length - 1) {
            continue;
          }

          let sacttering = Math.floor(Math.random() * randomScattering);

          const numberOverflow = mappedItems[0].probability < sacttering;

          if (!numberOverflow && Math.random() > 0.5) {
            sacttering *= -1;
          }

          mappedItems[i].probability += sacttering;
          mappedItems[i + 1].probability -= sacttering;
        }
      }

      mappedItems = mappedItems.sort(
        (item1, item2) => item1.probability - item2.probability
      );

      mappedItems.reduce((acc, item) => {
        const sum = acc + item.probability;

        item.init = item.probability;
        item.probability = sum;

        return sum;
      }, 0);

      let minRightElIdx = null;
      let maxLeftElIdx = null;

      let choiced = false;

      mappedItems.forEach((item, j) => {
        const targetProbability = item.probability;

        if (
          targetProbability >= random &&
          (minRightElIdx === null ||
            targetProbability < mappedItems[minRightElIdx])
        ) {
          minRightElIdx = j;

          return;
        }

        if (
          !choiced &&
          targetProbability <= random &&
          (maxLeftElIdx === null ||
            targetProbability > mappedItems[maxLeftElIdx])
        ) {
          maxLeftElIdx = j;

          return;
        }
      });

      const targetIndex = minRightElIdx === null ? maxLeftElIdx : minRightElIdx;

      await mappedItems[targetIndex].item.click();
      await new Promise((r) => setTimeout(r, 300));

      logger.success("Option clicked: " + targetIndex);
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

export const runFlowSeries = async (howMuch, divider = 35) => {
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
