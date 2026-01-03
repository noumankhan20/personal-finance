import express from 'express'
import dotenv from 'dotenv'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'path'
import cors from 'cors'

dotenv.config()

const PORT = process.env.PORT || 5000
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads')

const app = express()

/**
 * CORS
 */
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

/**
 * Static files
 */
app.use('/uploads', express.static(UPLOAD_ROOT))

/**
 * Middleware
 */
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev'))

/**
 * Health check
 */
app.get('/', (_req, res) => {
  res.send('Backend server running...')
})

/**
 * Server bootstrap
 */
async function startServer() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    app.listen(PORT, () => {
      console.log(
        `Server running in ${
          process.env.NODE_ENV || 'development'
        } mode on port ${PORT}`
      )
    })
  } catch (error) {
    console.error('❌ Failed to connect to database')
    console.error(error)
    process.exit(1)
  }
}

startServer()
