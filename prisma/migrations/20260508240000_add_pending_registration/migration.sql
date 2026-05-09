CREATE TABLE IF NOT EXISTS "PendingRegistration" (
  "email"            TEXT        NOT NULL,
  "name"             TEXT        NOT NULL,
  "passwordHash"     TEXT        NOT NULL,
  "marketingConsent" BOOLEAN     NOT NULL,
  "ageConsent"       BOOLEAN     NOT NULL,
  "referralCode"     TEXT,
  "otpHash"          TEXT        NOT NULL,
  "otpExp"           TIMESTAMP(3) NOT NULL,
  "attempts"         INTEGER     NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("email")
);
