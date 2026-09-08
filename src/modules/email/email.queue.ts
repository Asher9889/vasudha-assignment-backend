import { Queue } from "bullmq";

import { redisConnectionOptions } from "../../config";
import { EMAIL_QUEUE } from "./email.constants";

const emailQueue = new Queue(EMAIL_QUEUE.NAME, { connection: redisConnectionOptions  });

export { emailQueue };




