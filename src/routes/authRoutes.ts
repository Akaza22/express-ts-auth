import express from 'express';
import { 
    register, 
    login, 
    getAllUsers, 
    deleteUser, 
    changePassword,
} from '../controllers/authControllers'
import { 
    createUniversity, 
    deleteUniversity, 
    editUniversity, 
    getAllUniversities 

} from '../controllers/univControllers';
import { getAllFaculties } from '../controllers/facultyControllers'
import { authMiddleware } from '../middlewares/authMiddlewares';

const router = express.Router();

router.post('/register', register); // Handler tanpa error
router.post('/login', login);
router.get('/users', authMiddleware, getAllUsers); // Middleware dan handler kompatibel
router.delete('/users/:id', authMiddleware, deleteUser);
router.put('/change-password', changePassword);

//univ
router.get('/universities', authMiddleware, getAllUniversities);
router.post('/universities', authMiddleware, createUniversity)
router.delete('/universities/:id', authMiddleware, deleteUniversity)
router.put('/universities/:id', authMiddleware, editUniversity)

//fakultas
router.get('/faculties', authMiddleware, getAllFaculties);

export default router;
