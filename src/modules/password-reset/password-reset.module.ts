import PasswordResetController from "./password-reset.controller";
import PasswordResetService from "./password-reset.service";

const passwordResetService = new PasswordResetService();
const passwordResetController = new PasswordResetController(passwordResetService);

export { passwordResetController, passwordResetService };