import chalk from "chalk";

export function logWithRandomColor() {
  return chalk.rgb(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
  );
}

export function mostFrequent(arr) {
  let hash = new Map();

  for (let i = 0; i < arr.length; i++) {
    if (hash.has(arr[i])) {
      hash.set(arr[i], hash.get(arr[i]) + 1);
    } else {
      hash.set(arr[i], 1);
    }
  }

  let maxCount = 0;
  let res = -1;

  hash.forEach((value, key) => {
    if (maxCount < value) {
      res = key;
      maxCount = value;
    }
  });

  return [res, maxCount];
}

export const createLoggers = (flowNumber, iterationNumber) => {
  const chulkLogger = logWithRandomColor();

  const prefix = `[${chalk.white(flowNumber)}][${chalk.white(
    iterationNumber
  )}]`;
  return {
    error: (str) =>
      console.log(
        chulkLogger(`[${chalk.redBright("ERROR")}]  ${prefix}: ${str}`)
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

export const cameTrue = (prob) => Math.random() < prob / 100;
