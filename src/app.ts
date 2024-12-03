import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import cors from 'cors';


dotenv.config();

const app = express();

// Middleware
app.use(express.json());

//cors
app.use(cors({
    origin: '*', // Mengizinkan semua domain
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}))

// Routes
app.use('/api/auth', authRoutes);

export default app;
