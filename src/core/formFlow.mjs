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

    if (!elements.length) {
      throw new Error('No elements found with role="listitem"');
    }

    for (let i = 0; i < elements.length; i++) {
      const probabilities = probabilitiesConfig[i + 1];
      const meta = processConfig[i + 1];
      const element = elements[i];

      const htmlElements = await element.$$("label");

      const inputWrapper =
        meta?.hasInput && (await htmlElements.pop().getProperty("parentNode"));
      const input = inputWrapper && (await inputWrapper.$("input"));
      const inputLabel = inputWrapper && (await inputWrapper.$("label"));

      let items = [...htmlElements].map((element) => ({
        $: element,
      }));

      if (probabilities && input) {
        const writeItems = Object.values(probabilities).filter(
          (item) => item.writeItems?.length
        );

        if (writeItems.length) {
          items = items.concat(writeItems);
        }
      }

      if (!items.length) {
        continue;
      }

      let emptyProbabilityTotal = items.reduce((probability, _, i) => {
        const targetProbability =
          probabilities &&
          (typeof probabilities[i + 1] === "number"
            ? probabilities[i + 1]
            : probabilities[i + 1]?.probability);

        if (!targetProbability) {
          return probability;
        }

        return probability - targetProbability;
      }, 100);

      if (emptyProbabilityTotal < 0) {
        emptyProbabilityTotal = 0;
      }

      const averageProbability =
        emptyProbabilityTotal === 0
          ? 0
          : emptyProbabilityTotal /
            ((probabilities &&
              items.filter((_, i) =>
                typeof probabilities[i + 1] === "number"
                  ? probabilities[i + 1]
                  : !probabilities[i + 1]?.probability
              ).length) ||
              1);

      let mappedItems = items.map((item, j) => {
        const probability =
          typeof probabilities?.[j + 1]?.probability === "number"
            ? probabilities?.[j + 1]?.probability
            : probabilities?.[j + 1];

        const targetProbability =
          typeof probability !== "number" ? averageProbability : probability;

        return {
          ...item,
          probability: targetProbability,
        };
      });

      const maxProbability = Math.max(
        100,
        ...mappedItems.map((item) => item.probability)
      );

      const random = Math.floor(Math.random() * maxProbability);
      logger.info(`Procesing question: ${i}, random: ${random}`);

      if (!meta?.fixedProb && mappedItems.length > 1) {
        for (let i = 0; i < mappedItems.length; i++) {
          if (i === mappedItems.length - 1) {
            continue;
          }

          let subValue = 0;

          if (Math.random() < 0.5) {
            const minValue = Math.min(
              mappedItems[i].probability,
              scatteringValue
            );

            subValue = -1 * Math.random() * minValue;
          } else {
            const minValue = Math.min(
              mappedItems[i + 1].probability,
              scatteringValue
            );

            subValue = Math.random() * minValue;
          }

          mappedItems[i].probability += subValue;
          mappedItems[i + 1].probability -= subValue;
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
      const targetItem = mappedItems[targetIndex];

      // @ts-ignore
      if (input && targetItem.writeItems) {
        const randomIndex = Math.floor(
          // @ts-ignore
          Math.random() * targetItem.writeItems.length
        );

        await inputLabel.click();
        input.focus();
        // @ts-ignore
        await page.keyboard.type(targetItem.writeItems[randomIndex]);
        logger.success(
          "Value writed:",
          // @ts-ignore
          targetItem.writeItems[randomIndex]
        );
      }

      if (targetItem.$) {
        await targetItem.$.click();

        logger.success("Option clicked: " + targetIndex);
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    logger.success("Form has filled");

    const buttons = await page.$$('[role="button"]');

    if (!buttons[27]) {
      throw new Error(
        '27th button with role="button" suggested as submit button not found'
      );
    }

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
