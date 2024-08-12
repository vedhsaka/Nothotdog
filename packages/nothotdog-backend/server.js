require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const voiceRoutes = require('./routes/api');
const app = express();
const PORT = process.env.PORT || 3000;
const logger = require('./utils/logger');

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT, // Update this to the origin of your client application
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization,userId',
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight request handler
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));


// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      userId: req.get('userId') || 'anonymous'
    });
  });
  next();
});

// Error logging middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.get('userId') || 'anonymous'
  });
  res.status(500).json({ message: 'Internal Server Error' });
});

// Test Route
app.get('/', (req, res) => {
  logger.info('Home route accessed');
  res.send('hello World!');
});

// Use routes
app.use('/api', voiceRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app };
