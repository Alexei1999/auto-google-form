import { formFlow } from "./flow.mjs";

import poisson from "poisson-process";
import chalk from "chalk";
import dayjs from "dayjs";

const time = 6 * 60 * 1000; // 1 per 6 minutes; 10 per 1 hour;

const logger = (timeLeft) => {
  console.log(
    chalk.cyanBright(
      `Next task in ${timeLeft.minute()} min and ${timeLeft.second()} sec`
    )
  );
};

(async () => {
  let counter = 0;
  let init = false;

  let nextTime = dayjs();

  do {
    await new Promise((resolve) => {
      const addTime = poisson.sample(time);
      nextTime = dayjs().add(addTime, "ms");

      if (!init) {
        logger(nextTime.subtract(dayjs()));
      }

      setTimeout(() => {
        init = true;

        formFlow(counter).then(() => {
          logger(nextTime.subtract(dayjs()));
          counter++;
        });

        resolve();
      }, addTime);
    });
  } while (counter <= 100);
})();
