// Upserts the admin user on every deploy. Safe to run multiple times.
const { Client } = require("pg");

async function main() {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    console.warn("⚠ ADMIN_PASSWORD_HASH not set — skipping admin user creation.");
    return;
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    INSERT INTO "User" (
      id, name, email, password, role, plan, "subscriptionStatus", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'Admin CVV Pro',
      'admin@cvvpro.com',
      $1,
      'SUPER_ADMIN',
      'PRO',
      'ACTIVE',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE
      SET role                 = 'SUPER_ADMIN',
          plan                 = 'PRO',
          "subscriptionStatus" = 'ACTIVE',
          password             = $1,
          "updatedAt"          = NOW()
  `, [passwordHash]);

  await client.end();
  console.log("✔ Admin user ready: admin@cvvpro.com");
}

main().catch((err) => {
  console.error("✖ create-admin failed:", err.message);
  process.exit(1);
});
