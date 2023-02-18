import chalk from "chalk";
import { formFlow } from "./formFlow.mjs";
// @ts-ignore
import poisson from "poisson-process";
// @ts-ignore
import dayjs from "dayjs";
import { format } from "../constants.mjs";

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
  { shutdownRange } = { shutdownRange: undefined }
) => {
  const logTime = (/** @type {dayjs.Dayjs} */ nextTime) => {
    const diffInMilliseconds = dayjs(nextTime).diff(dayjs());

    if (diffInMilliseconds < 0) {
      console.log(chalk.cyan(`Next task isn't scheduled`));

      return;
    }

    const { output } = giveDiffLog(diffInMilliseconds);

    console.log(
      chalk.cyanBright(
        `[${dayjs().format(format)}]: Next task in ${output} (${nextTime.format(
          format
        )})`
      )
    );
  };

  let isShutdonwed = false;
  let counter = 0;
  let init = false;

  let nextTime = dayjs();

  do {
    await new Promise((resolve) => {
      const addTime = poisson.sample(averageCallPeriodMs);
      nextTime = dayjs().add(addTime, "ms");

      let range =
        typeof shutdownRange === "function" ? shutdownRange() : shutdownRange;

      if (
        range &&
        dayjs(range[0]).isBefore(dayjs()) &&
        dayjs(range[1]).isAfter(dayjs())
      ) {
        isShutdonwed = true;

        const { output } = giveDiffLog(dayjs(nextTime).diff(dayjs()));

        const prefix = `[${dayjs().format(format)}]`;

        console.log(
          chalk.yellow(
            `${prefix} Sleeping for ${output} (${nextTime.format(format)})`
          )
        );
        console.log(
          chalk.yellow(
            `${" ".repeat(prefix.length)} Shutdown bounds: [${dayjs(
              range[0]
            ).format(format)} | ${dayjs(range[1]).format(format)}]`
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
            flowPrefix: counter,
            ...flowConfig,
          }).then(() => {
            logTime(nextTime);
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
