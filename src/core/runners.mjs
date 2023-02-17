import chalk from "chalk";
import * as dayjs from "dayjs";
import { Dayjs } from "dayjs";
import { formFlow } from "./formFlow.mjs";
// @ts-ignore
import poisson from "poisson-process";

const runFormPeriodic = async (
  /** @type {number} */ howMuch,
  /** @type {number} */ averageCallPeriodMs,
  /** @type {any} */ flowConfig
) => {
  const logTime = (/** @type {Dayjs} */ nextTime) => {
    const diffInMilliseconds = dayjs().diff(nextTime);

    const diffInSeconds = diffInMilliseconds / 1000;
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;

    console.log(
      chalk.cyanBright(`Next task in ${minutes} min and ${seconds} sec`)
    );
  };

  let counter = 0;
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
  } while (counter <= howMuch);
};

const runFormSeries = async (
  /** @type {number} */ howMuch,
  chunkSize = 35,
  /** @type {any} */ flowConfig
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
