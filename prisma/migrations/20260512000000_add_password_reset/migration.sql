-- CreateTable
CREATE TABLE "PasswordReset" (
    "email"     TEXT NOT NULL,
    "otpHash"   TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts"  INTEGER NOT NULL DEFAULT 0,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("email")
);
