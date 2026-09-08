import { Job, Worker } from "bullmq";
import { EMAIL_QUEUE } from "./email.constants";
import { logger, redisConnectionOptions } from "../../config";
import EmailService from "./email.service";
import { TCreateUserPayload } from "../user";

class EmailWorker {
    private readonly worker: Worker;
    private readonly emailService: EmailService;



    constructor(emailService: EmailService) {
        this.worker = this.createWorker();
        this.emailService = emailService;
    }

    private createWorker = () => {
        const worker = new Worker(EMAIL_QUEUE.NAME, this.handleJob, { connection: redisConnectionOptions });

        worker.on("completed", (job) => {
            logger.info(`Job ${job.id} has completed!`);
        });

        worker.on("failed", (job, err) => {
            logger.error(`Job ${job?.id} has failed with error: ${err.message}`);
        });

        worker.on("error", (err) => {
            logger.error(`Worker encountered an error: ${err.message}`);
        });
        return worker;
    }

    private handleJob = async (job: Job) => {
        switch (job.name) {
            case EMAIL_QUEUE.JOBS.USER_CREATED:
                await this.sendUserCreatedEmail(job.data);
                break;
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    private sendUserCreatedEmail = async (data: TCreateUserPayload) => {
        try {
            console.log(`Sending email with data:`, data);
            await this.emailService.sendUserCreatedEmail(data);
        } catch (error) {
            console.error(`Error occurred while sending email in worker layer:`, error);
            throw error;
        }
    }


}

export default EmailWorker; 