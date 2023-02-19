import chalk from "chalk";
// @ts-ignore
import dayjs from "dayjs";

const isDefined = (value) => value !== undefined && value !== null;

export const createLoggers = (flowPrefix, iterationPrefix) => {
  const chulkLogger = chalk.rgb(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  );

  const prefix = [
    isDefined(flowPrefix) && `[${chalk.white(flowPrefix)}]`,
    isDefined(iterationPrefix) && `[${chalk.white(iterationPrefix)}]`,
  ]
    .filter(Boolean)
    .join("");

  return {
    error: (str = "", notFormattedStr = "") =>
      console.log(
        chulkLogger(
          `[${chalk.redBright("ERROR")}]  ${prefix}: ${chalk.redBright(str)}`
        ),
        notFormattedStr
      ),
    warn: (str = "", notFormattedStr = "") =>
      console.log(
        chulkLogger(`[${chalk.yellowBright("WARN")}]   ${prefix}: ${str}`),
        notFormattedStr
      ),
    info: (str = "", notFormattedStr = "") =>
      console.log(
        chulkLogger(`[${chalk.blueBright("INFO")}]   ${prefix}: ${str}`),
        notFormattedStr
      ),
    success: (str = "", notFormattedStr = "") =>
      console.log(
        chulkLogger(`[${chalk.greenBright("SUCCESS")}]${prefix}: ${str}`),
        notFormattedStr
      ),
    finallSuccess: (str = "", notFormattedStr = "") =>
      console.log(
        chulkLogger(
          `[${chalk.greenBright("SUCCESS")}]${prefix}: ${chalk.greenBright(
            str
          )}`
        ),
        notFormattedStr
      ),
  };
};

export const findTargetRangeIndex = (
  /** @type { (dayjs.Dayjs)[]} */ ranges
) => {
  for (let i = 0; i < ranges.length; i += 2) {
    if (i === ranges.length - 1) {
      continue;
    }

    if (
      dayjs(ranges[i]).isBefore(dayjs()) &&
      dayjs(ranges[i + 1]).isAfter(dayjs())
    ) {
      return i;
    }
  }

  return -1;
};
