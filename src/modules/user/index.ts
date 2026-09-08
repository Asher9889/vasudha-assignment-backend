import { TUserRole, USER_ROLE, TCreateUserPayload } from "./user.types";
import UserModel, { IUser } from "./user.model";
import { ACCOUNT_STATUS, USER_EVENTS } from "./user.constant";
import userRoutes from "./user.routes";

export type { TUserRole, IUser, TCreateUserPayload }
export { UserModel, USER_ROLE, ACCOUNT_STATUS, USER_EVENTS, userRoutes };