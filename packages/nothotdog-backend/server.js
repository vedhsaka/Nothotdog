import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import voiceRoutes from './routes/api.js';
import process from 'process';

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization,userId',
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Test Route
app.get('/', (req, res) => {
  res.send('hello World!');
});

// Use routes
app.use('/api', voiceRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { app };
