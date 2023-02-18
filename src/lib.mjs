import chalk from "chalk";

export const createLoggers = (flowPrefix, iterationPrefix) => {
  const chulkLogger = chalk.rgb(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  );

  const prefix = [
    flowPrefix && `[${chalk.white(flowPrefix)}]`,
    iterationPrefix && `[${chalk.white(iterationPrefix)}]`,
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
