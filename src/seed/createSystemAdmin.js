import dotenv from "dotenv";

dotenv.config();

import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { ROLES } from "../constants/roles.js";
import * as userRepository from "../modules/user/repositories/user.repository.js";
import { hashPassword } from "../utils/password.js";

const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
const firstName = process.env.SEED_ADMIN_FIRST_NAME ?? "System";
const lastName = process.env.SEED_ADMIN_LAST_NAME ?? "Admin";

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (!email || !password) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env",
    );
  }

  await connectDatabase(process.env.MONGO_URI);

  const existing = await userRepository.findUserByEmail(email);

  if (existing) {
    console.log(`System admin already exists: ${email}`);
    await disconnectDatabase();
    return;
  }

  await userRepository.createUser({
    firstName,
    lastName,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: ROLES.SYSTEM_ADMIN,
  });

  console.log(`System admin created: ${email}`);
  console.log("Delete src/seed/createSystemAdmin.js after this succeeds.");

  await disconnectDatabase();
};

seed().catch(async (error) => {
  console.error(error.message);
  await disconnectDatabase();
  process.exit(1);
});
