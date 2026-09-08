import authRoutes from "./auth.routes";
import { generateTokensPayload, TUserRole, generateJWTTokensResponse, TAccessTokenPayload } from "./auth.types";

export type { generateTokensPayload, TUserRole, generateJWTTokensResponse, TAccessTokenPayload };
export { authRoutes };