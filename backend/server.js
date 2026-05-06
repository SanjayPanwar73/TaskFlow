const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { securityHeaders } = require('./middleware/security');

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

mongoose.set('sanitizeFilter', true);

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Temp-Task-Manager TaskFlow API is running.' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

app.use(notFound);
app.use(errorHandler);

const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const PORT = process.env.PORT || 5000;

const validateEnv = () => {
  const missingValues = requiredEnv.filter((key) => !process.env[key]);

  if (missingValues.length > 0) {
    throw new Error(`Missing required environment variables: ${missingValues.join(', ')}`);
  }
};

const startServer = async () => {
  validateEnv();
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server failed to start:', error.message);
    }

    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    server.close(() => process.exit(1));
  });
};

startServer().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exit(1);
});
