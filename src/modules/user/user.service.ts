import { TCreateUserPayload, TUpdateAccountStatusPayload } from "./user.types";
import UserModel from "./user.model";
import { ApiError } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { eventBus } from "../../events";
import { USER_EVENTS, USER_ROLE, ACCOUNT_STATUS } from "./user.constant";
class UserService {

    createUser = async (userData: TCreateUserPayload) => {
        try {
            const { email, password:ps, role, accountStatus } = userData;
            const user = await UserModel.findOne({ email }).lean();
            if (user) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Account already exists. Please login to continue.");
            }

            const createdUser = await UserModel.create({
                email,
                password : ps,
                role,
                accountStatus
            });

            eventBus.emit(USER_EVENTS.USER.CREATED, userData);

            let { _id, password, ...rest } = createdUser.toObject();
            return { id: _id.toString(), ...rest };

        } catch (error) {
            throw error; 
        }
    }

    updateAccountStatus = async (userId: string, payload: TUpdateAccountStatusPayload) => {
        const { accountStatus } = payload;

        const user = await UserModel.findById(userId);
        if (!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
        }

        if (user.role !== USER_ROLE.ADMIN) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Only admin accounts can be enabled or disabled.");
        }

        if (user.accountStatus === accountStatus) {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Admin account is already ${accountStatus === ACCOUNT_STATUS.ACTIVE ? "active" : "inactive"}.`);
        }

        user.accountStatus = accountStatus;
        await user.save();

        let { _id, password, ...rest } = user.toObject();
        return { id: _id.toString(), ...rest };
    }
}

export default UserService;