import bcrypt from "bcrypt";
import { prisma } from "../src/config/db.config";

const ADMIN_PASSWORD = "Admin@123"; // change after first login

async function createAdmin() {
  const existingAdmin = await prisma.admin.findFirst();

  if (existingAdmin) {
    console.log("✅ Admin already exists");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.admin.create({
    data: {
      passwordHash,
    },
  });

  console.log("✅ Admin created successfully");
  console.log("👉 Default password:", ADMIN_PASSWORD);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("❌ Failed to create admin:", err);
  process.exit(1);
});
