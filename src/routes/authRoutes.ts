import express from 'express';
import { register, login, getAllUsers, deleteUser, changePassword } from '../controllers/authControllers'
import { authMiddleware } from '../middlewares/authMiddlewares';

const router = express.Router();

router.post('/register', register); // Handler tanpa error
router.post('/login', login);
router.get('/users', authMiddleware, getAllUsers); // Middleware dan handler kompatibel
router.delete('/users/:id', authMiddleware, deleteUser);
router.put('/change-password', changePassword);

export default router;
