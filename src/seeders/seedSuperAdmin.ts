import argon2 from "argon2";
import connectMongoDB from "../db/connectMongoDB";
import { envConfig, logger } from "../config";
import { ACCOUNT_STATUS, UserModel, USER_ROLE} from "../modules/user";

async function seedSuperAdmin(): Promise<void> {
    await connectMongoDB();

    const { email, password } = envConfig.superAdmin;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
        logger.info("Super admin already exists");
        process.exit(0);
    }

    const hashedPassword = await argon2.hash(password);

    await UserModel.create({
        email,
        password: hashedPassword,
        role: USER_ROLE.SUPER_ADMIN,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
    });

    logger.info("Super admin seeded successfully");
    process.exit(0);
}

seedSuperAdmin().catch((error) => {
    logger.error("Error seeding super admin: " + error);
    process.exit(1);
});
