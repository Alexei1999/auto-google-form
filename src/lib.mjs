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
    error: (str) =>
      console.log(
        chulkLogger(
          `[${chalk.redBright("ERROR")}]  ${prefix}: ${chalk.redBright(str)}`
        )
      ),
    warn: (str) =>
      console.log(
        chulkLogger(`[${chalk.yellowBright("WARN")}]   ${prefix}: ${str}`)
      ),
    info: (str) =>
      console.log(
        chulkLogger(`[${chalk.blueBright("INFO")}]   ${prefix}: ${str}`)
      ),
    success: (str) =>
      console.log(
        chulkLogger(`[${chalk.greenBright("SUCCESS")}]${prefix}: ${str}`)
      ),
    finallSuccess: (str) =>
      console.log(
        chulkLogger(
          `[${chalk.greenBright("SUCCESS")}]${prefix}: ${chalk.greenBright(
            str
          )}`
        )
      ),
  };
};
