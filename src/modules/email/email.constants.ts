const EMAIL_QUEUE = {
    NAME: "vasudha-email",

    JOBS: {
        USER_CREATED: "user_created",
        PASSWORD_RESET: "password_reset",
    },
} as const;

export { EMAIL_QUEUE };