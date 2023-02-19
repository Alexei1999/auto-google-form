import chalk from "chalk";
import { formFlow } from "./formFlow.mjs";
// @ts-ignore
import poisson from "poisson-process";
// @ts-ignore
import dayjs from "dayjs";
import { format } from "../constants.mjs";
import { findTargetRangeIndex } from "../lib.mjs";

const giveDiffLog = (/** @type {number} */ ms) => {
  const diffInSeconds = ms / 1000;

  const seconds = diffInSeconds % 60;
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const firstOutput = [
    days && `${days} days`,
    hours && `${hours} hs`,
    minutes && `${minutes} min`,
  ]
    .filter(Boolean)
    .join(", ");

  const secondOutput = `${firstOutput ? ` and ` : ""}${Math.floor(
    seconds
  )} sec`;

  return {
    seconds,
    minutes,
    hours,
    days,
    output: firstOutput + secondOutput,
  };
};

const runFormPeriodic = async (
  /** @type {any} */ flowConfig,
  /** @type {number} */ howMuch,
  /** @type {number} */ averageCallPeriodMs,
  /** @type {{ shutdownRanges?: (() => (dayjs.Dayjs)[]) | (dayjs.Dayjs)[] }} */ {
    shutdownRanges,
  } = {
    shutdownRanges: undefined,
  }
) => {
  const logTime = (/** @type {dayjs.Dayjs} */ nextTime, errorTheme = false) => {
    const diffInMilliseconds = dayjs(nextTime).diff(dayjs());

    const colorFunc = errorTheme ? chalk.magenta : chalk.cyan;
    const colorBrightFunc = errorTheme ? chalk.magentaBright : chalk.cyanBright;

    if (diffInMilliseconds < 0) {
      console.log(colorFunc(`Next task isn't scheduled`));

      return;
    }

    const { output } = giveDiffLog(diffInMilliseconds);

    console.log(
      colorBrightFunc(
        `[${dayjs().format(format)}]: Next task in ${output} (${nextTime.format(
          format
        )})`
      )
    );
  };

  let counter = 0;
  let init = false;

  let nextTime = dayjs();

  do {
    await new Promise((resolve) => {
      const addTime = poisson.sample(averageCallPeriodMs);
      nextTime = dayjs().add(addTime, "ms");

      const ranges =
        typeof shutdownRanges === "function"
          ? shutdownRanges()
          : Array.isArray(shutdownRanges) && shutdownRanges;

      const targetRangeIndex = findTargetRangeIndex(ranges);
      const isShutdowned =
        typeof targetRangeIndex === "number" && targetRangeIndex !== -1;

      if (isShutdowned) {
        const targetRange = [
          ranges[targetRangeIndex],
          ranges[targetRangeIndex + 1],
        ];
        const { output } = giveDiffLog(dayjs(nextTime).diff(dayjs()));

        const prefix = `[${dayjs().format(format)}]: `;

        console.log(
          chalk.yellow(
            `${prefix}Sleeping for ${output} (${nextTime.format(format)})`
          )
        );
        console.log(
          chalk.yellow(
            `${" ".repeat(prefix.length)}Shutdown bounds number ${
              Math.floor(targetRangeIndex / 2) + 1
            }`
          )
        );
        console.log(
          chalk.yellow(
            `${" ".repeat(prefix.length)}[${dayjs(targetRange[0]).format(
              format
            )}] | [${dayjs(targetRange[1]).format(format)}]`
          )
        );

        setTimeout(resolve, addTime);
      } else {
        if (!init) {
          logTime(nextTime);
        }

        setTimeout(() => {
          init = true;

          formFlow({
            flowPrefix: counter + 1,
            ...flowConfig,
          })
            .then(() => {
              logTime(nextTime);
            })
            .catch(() => {
              counter--;
              logTime(nextTime, true);
            });

          counter++;
          resolve();
        }, addTime);
      }
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
          flowPrefix: `${i + 1}/${launches}`,
          iterationPrefix: `${iteration + 1}/${iterations}`,
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
