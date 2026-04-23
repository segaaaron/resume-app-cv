// Upserts the admin user on every deploy. Safe to run multiple times.
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`
    INSERT INTO "User" (
      id, name, email, password, role, plan, "subscriptionStatus", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text,
      'Admin CVV Pro',
      'admin@cvvpro.com',
      '$2b$12$0bAdu5XzSrNgcL.LZ8Fuhuye/HiDL1tfJ.hQ3z8Lfft2NNjQkD5jS',
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
          "updatedAt"          = NOW()
  `);

  await client.end();
  console.log("✔ Admin user ready: admin@cvvpro.com");
}

main().catch((err) => {
  console.error("✖ create-admin failed:", err.message);
  process.exit(1);
});
