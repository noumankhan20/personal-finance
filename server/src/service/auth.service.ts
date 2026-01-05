import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.config';

export const loginAdmin = async (password: string) => {
  const admin = await prisma.admin.findFirst();
  if (!admin) return null;

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return null;

  return jwt.sign(
    { adminId: admin.id },
    process.env.JWT_SECRET!,
    { expiresIn: '12h' }
  );
};
