// Entry point for local development and always-on hosts.
const config = require('./config/env')
const app = require('./app')
const { connectDB } = require('./config/db')

connectDB()
  .then(() => {
    console.log('MongoDB connected')
    app.listen(config.port, () => {
      console.log(
        `Server running on port ${config.port} (${config.isProd ? 'production' : 'development'})`
      )
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
