const USER_ROLE = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
} as const;

const ACCOUNT_STATUS =  {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export { USER_ROLE, ACCOUNT_STATUS };