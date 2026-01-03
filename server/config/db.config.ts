import dotenv from 'dotenv'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL')
}

// ✅ Create a single PG pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ✅ Prisma 7 adapter
const adapter = new PrismaPg(pool)

// ✅ Optional dev singleton to avoid multiple instances in watch mode
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
