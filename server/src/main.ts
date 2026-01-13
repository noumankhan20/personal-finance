import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import cors from 'cors';
import { prisma } from './config/db.config';
import acccountsRoutes from './routes/accounts.routes';
import categoriesRoutes from './routes/categories.routes';
import authRoutes from './routes/auth.routes'
import entryRoutes from './routes/entry.routes';
import loanRoutes from './routes/loan.routes';
import bankUploadRoutes from './routes/bankUploads.routes'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
  app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

// Middleware
app.use(morgan('dev'))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.use("/api/accounts",acccountsRoutes)
app.use("/api/categories",categoriesRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/entries', entryRoutes)
app.use('/api/loans',loanRoutes)
app.use('/api/bank-uploads', bankUploadRoutes);
// Sample route
app.get('/', (req, res) => {
  res.send('Backend server running...')
})

// Connect to the database and start the server
async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to connect to the database')
    console.error(error)
    process.exit(1)
  }
}

startServer()
