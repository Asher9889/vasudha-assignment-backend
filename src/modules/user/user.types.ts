import { USER_ROLE, ACCOUNT_STATUS } from "./user.constant";

type TUserRole = typeof USER_ROLE[keyof typeof USER_ROLE];
type TAccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];


export type { TUserRole, TAccountStatus };
export { USER_ROLE };