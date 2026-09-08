import { TCreateUserPayload, USER_EVENTS } from "../user";
import { emailQueue } from "./email.queue";
import { EventBus, eventBus } from "../../events";
import { Queue } from "bullmq";
import { EMAIL_QUEUE } from "./email.constants";
import { logger } from "../../config";



class EmailListener {
    private readonly eventBus: EventBus;
    private readonly emailQueue: Queue;

    constructor(eventBus: EventBus, emailQueue: Queue) {
        this.emailQueue = emailQueue;
        this.eventBus = eventBus;
    }

    register() {
        logger.info("Registering Email Listener for User Events...");
        this.eventBus.on(USER_EVENTS.USER.CREATED, this.handleUserCreated);
    }

    private handleUserCreated = async (payload: TCreateUserPayload) => {
        try {
            logger.info({ payload }, "User Created Event Received in Email Listener:" + JSON.stringify(payload));
            await this.emailQueue.add(EMAIL_QUEUE.JOBS.USER_CREATED, payload);
        } catch (error: any) {
            logger.error({ error: error.message }, "Error occurred while handling User Created Event in Email Listener:");
        }
    }
}

export default EmailListener;