require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const voiceRoutes = require('./routes/api');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Update this to the origin of your client application
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization,userId',
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight request handler
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Test Route
app.get('/', (req, res) => {
  res.send('hello World!');
});

// Use routes
app.use('/api', voiceRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app };
