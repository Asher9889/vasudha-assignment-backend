import { TCreateUserPayload } from "./user.types";
import UserModel from "./user.model";
import { ApiError } from "../../utils";
import { StatusCodes } from "http-status-codes";
import { eventBus } from "../../events";
import { USER_EVENTS } from "./user.constant";
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
}

export default UserService;