import EmailListener from "./email.listener";
import { emailQueue } from "./email.queue";
import { eventBus } from "../../events";
import EmailService from "./email.service";
import { nodeMailerTransporter } from "../../config";
import EmailWorker from "./email.worker";

const emailService = new EmailService(nodeMailerTransporter);
const emailListener = new EmailListener(eventBus, emailQueue);

const emailWorker = new EmailWorker(emailService);


export { emailListener };  