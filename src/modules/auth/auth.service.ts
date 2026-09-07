import { TLoginRequestDTO } from "./auth.types";
import AuthModel from "./auth.model";
import { ApiError } from "../../utils";
import { StatusCodes } from "http-status-codes";

class AuthService {

    login = async (loginPayload: TLoginRequestDTO) => {
        const { email, password } = loginPayload;

        // 1. check existence
        const user = await AuthModel.findOne({ email }); 
        if (!user) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Please register first or user correct credentials.");
        }

        // 2. check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid password or email");
        }  
 
        // 3. generate tokens
        const tokens = user.generateTokens({ id: user._id.toString(), role: user.role });
        return tokens;
    }
};

export default AuthService;