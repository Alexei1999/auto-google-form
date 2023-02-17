import puppeteer from "puppeteer";
import { createLoggers } from "../lib.mjs";

export async function formFlow({
  flowPrefix = "-",
  iterationPrefix,
  headless = true,
  varConfig,
  processConfig,
  probabilitiesConfig,
  scatteringValue,
  loggersConfig = createLoggers,
}) {
  if (!varConfig) {
    throw new Error("varConfig must be defined");
  }
  if (!processConfig) {
    throw new Error("processConfig must be defined");
  }
  if (!probabilitiesConfig) {
    throw new Error("probabilitiesConfig must be defined");
  }
  if (!scatteringValue) {
    throw new Error("scatteringValue must be defined");
  }
  if (!loggersConfig) {
    throw new Error("loggersConfig must be defined");
  }

  const logger = createLoggers(flowPrefix, iterationPrefix);

  logger.info("Starting: browser");
  const browser = await puppeteer.launch({ headless });

  logger.info("Starting: page");
  const page = await browser.newPage();

  logger.finallSuccess("Started");

  try {
    await page.goto(varConfig.formLink);

    logger.info("Form has opened");
    await page.waitForSelector("form");

    const elements = await page.$$('[role="listitem"]');

    for (let i = 0; i < elements.length; i++) {
      const random = Math.floor(Math.random() * 100);

      logger.info(`Procesing question: ${i}, random: ${random}`);

      const probabilities = probabilitiesConfig[i + 1];
      const meta = processConfig[i + 1];
      const element = elements[i];

      const items = [...(await element.$$("label"))];

      if (meta && meta.ignoreLast) {
        items.pop();
      }

      if (!items.length) {
        continue;
      }

      const emptyProbabilityTotal = items.reduce((probability, _, i) => {
        if (!probabilities || !probabilities[i + 1]) {
          return probability;
        }

        return probability - probabilities[i + 1];
      }, 100);

      const averageProbability =
        (emptyProbabilityTotal || 100) /
        (items.filter((_, i) => !probabilities || !probabilities[i + 1])
          .length || items.length);

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

          let sacttering = Math.floor(Math.random() * scatteringValue);

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

        // @ts-ignore
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
            targetProbability < mappedItems[minRightElIdx].probability)
        ) {
          minRightElIdx = j;

          return;
        }

        if (
          !choiced &&
          targetProbability <= random &&
          (maxLeftElIdx === null ||
            targetProbability > mappedItems[maxLeftElIdx].probability)
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

    logger.success("Form has filled");

    const buttons = await page.$$('[role="button"]');
    await buttons[27].click();

    await page.waitForNavigation({ waitUntil: "networkidle0" });

    logger.finallSuccess("Form has finished");
  } catch (error) {
    logger.error(error.message);

    throw error;
  } finally {
    await browser.close();
  }
}
