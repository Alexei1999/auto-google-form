import chalk from "chalk";
import { formFlow } from "./formFlow.mjs";
// @ts-ignore
import poisson from "poisson-process";
// @ts-ignore
import dayjs from "dayjs";

const runFormPeriodic = async (
  /** @type {any} */ flowConfig,
  /** @type {number} */ howMuch,
  /** @type {number} */ averageCallPeriodMs
) => {
  const logTime = (/** @type {dayjs.Dayjs} */ nextTime) => {
    const diffInMilliseconds = dayjs(nextTime).diff(dayjs());

    const diffInSeconds = diffInMilliseconds / 1000;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = Math.floor(diffInSeconds % 60);

    if (diffInMilliseconds < 0) {
      console.log(chalk.cyan(`Next task isn't scheduled`));

      return;
    }

    console.log(
      chalk.cyanBright(`Next task in ${minutes} min and ${seconds} sec`)
    );
  };

  let counter = 1;
  let init = false;

  let nextTime = dayjs();

  do {
    await new Promise((resolve) => {
      const addTime = poisson.sample(averageCallPeriodMs);
      nextTime = dayjs().add(addTime, "ms");

      if (!init) {
        logTime(nextTime);
      }

      setTimeout(() => {
        init = true;

        formFlow({
          flowPrefix: counter,
          ...flowConfig,
        }).then(() => {
          logTime(nextTime);
          counter++;
        });

        resolve();
      }, addTime);
    });
  } while (counter < howMuch);
};

const runFormSeries = async (
  /** @type {any} */ flowConfig,
  /** @type {number} */ howMuch,
  chunkSize = 35
) => {
  const iterations = Math.ceil(howMuch / chunkSize);
  const launches = Math.ceil(howMuch / iterations);

  for (let iteration of Array(iterations).keys()) {
    console.log(`Iteration number: ${iteration}`);

    await Promise.allSettled(
      [...Array(launches).keys()].map((i) =>
        formFlow({
          flowPrefix: `${i}/${launches - 1}`,
          iterationPrefix: `${iteration}/${iterations - 1}`,
          ...flowConfig,
        })
      )
    ).then((results) => {
      const rejectedCount = results.filter(
        (result) => result.status === "rejected"
      ).length;

      console.log(`Number of rejected promises: ${rejectedCount}`);
    });
  }
};

export const runners = {
  runPeriodic: runFormPeriodic,
  runSeries: runFormSeries,
};
