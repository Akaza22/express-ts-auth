import express from 'express';
import { 
    register, 
    login, 
    getAllUsers, 
    deleteUser, 
    changePassword,
    logoutUser,
} from '../controllers/authControllers'
import { 
    createUniversity, 
    deleteUniversity, 
    editUniversity, 
    getAllUniversities 

} from '../controllers/univControllers';
import { 
    createFaculty, 
    deleteFaculty, 
    editFaculty, 
    getAllFaculties, 
    getFacultiesByUniversity
} from '../controllers/facultyControllers'
import { authMiddleware } from '../middlewares/authMiddlewares';
import { createMajor, deleteMajor, getMajorsByUniversityAndFaculty, updateMajor } from '../controllers/majorControllers';

const router = express.Router();

router.get('/test', (req, res) => {
  res.status(200).json({ message: 'API JALAN WOY' });
});

//auth
router.post('/register', register); // Handler tanpa error
router.post('/login', login);
router.get('/users', authMiddleware, getAllUsers); // Middleware dan handler kompatibel
router.delete('/users/:id', authMiddleware, deleteUser);
router.put('/change-password', changePassword);

router.post('/logout', authMiddleware, logoutUser);

//univ
router.get('/universities', authMiddleware, getAllUniversities);
router.post('/universities', authMiddleware, createUniversity)
router.delete('/universities/:id', authMiddleware, deleteUniversity)
router.put('/universities/:id', authMiddleware, editUniversity)

//fakultas
router.get('/faculties', authMiddleware, getAllFaculties);
router.post('/faculties', authMiddleware, createFaculty);
router.delete('/faculties', authMiddleware, deleteFaculty);
router.get('/faculties/:university_name', authMiddleware, getFacultiesByUniversity);
router.put('/faculties/:faculty_id', authMiddleware, editFaculty);

//Jurusan
router.post('/majors', authMiddleware, createMajor)
router.get('/majors/:universityName/:facultyName', authMiddleware, getMajorsByUniversityAndFaculty);
router.delete('/majors/:univName/:facultyName/:majorName', deleteMajor);
router.put('/majors/:univName/:facultyName/:majorName', updateMajor);


export default router;
