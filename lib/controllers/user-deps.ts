// lib/controllers/user-deps.ts
import { UserService } from "@/lib/services/user/UserService"
import { createLogger } from "@/lib/logger"

export const userService = new UserService(createLogger("UserService"))
