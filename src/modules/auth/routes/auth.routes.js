import { Router } from "express";
import { authenticate } from "../../../middlewares/authenticate.js";
import { authRateLimiter } from "../../../middlewares/authRateLimiter.js";
import { validate } from "../../../middlewares/validate.js";
import * as authController from "../controllers/auth.controller.js";
import { loginSchema } from "../validations/auth.validation.js";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", authRateLimiter, authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
