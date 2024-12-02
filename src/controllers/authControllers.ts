import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import { generateToken, verifyToken } from '../utils/jwtHelper';

// Fungsi Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Cari pengguna berdasarkan email
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (!user.rows.length) {
      res.status(401).json({
        status: 401,
        message: 'Invalid credentials',
        data: [],
      });
      return;
    }

    // Validasi password
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      res.status(401).json({
        status: 401,
        message: 'Invalid credentials',
        data: [],
      });
      return;
    }

    // Generate token
    const token = generateToken({ id: user.rows[0].id });

    // Kembalikan token dalam respons
    res.status(200).json({
      status: 200,
      message: 'Login successful',
      data: { token },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
      data: [],
    });
  }
};

// Fungsi Register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, universityName, facultyName, majorName } = req.body;

  try {
    // Validasi input
    if (!name || !email || !password || !universityName || !facultyName || !majorName) {
      res.status(400).json({
        status: 400, 
        message: 'All fields are required',
        data: []
      });
      return;
    }

    // Periksa apakah email sudah ada
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({
        status: 400, 
        message: 'Email already in use',
        data: []
      });
      return;
    }

    // Cek apakah universitas sudah ada
    let university = await pool.query('SELECT * FROM universities WHERE name = $1', [universityName]);
    if (university.rows.length === 0) {
      // Jika universitas belum ada, masukkan ke tabel universities
      const newUniversity = await pool.query('INSERT INTO universities (name) VALUES ($1) RETURNING id', [universityName]);
      university = newUniversity;
    }

    // Cek apakah fakultas sudah ada
    let faculty = await pool.query('SELECT * FROM faculties WHERE name = $1 AND university_id = $2', [facultyName, university.rows[0].id]);
    if (faculty.rows.length === 0) {
      // Jika fakultas belum ada, masukkan ke tabel faculties
      const newFaculty = await pool.query('INSERT INTO faculties (name, university_id) VALUES ($1, $2) RETURNING id', [facultyName, university.rows[0].id]);
      faculty = newFaculty;
    }

    // Cek apakah jurusan sudah ada
    let major = await pool.query('SELECT * FROM majors WHERE name = $1 AND faculty_id = $2', [majorName, faculty.rows[0].id]);
    if (major.rows.length === 0) {
      // Jika jurusan belum ada, masukkan ke tabel majors
      const newMajor = await pool.query('INSERT INTO majors (name, faculty_id) VALUES ($1, $2) RETURNING id', [majorName, faculty.rows[0].id]);
      major = newMajor;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna ke database
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, university_id, faculty_id, major_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, hashedPassword, university.rows[0].id, faculty.rows[0].id, major.rows[0].id]
    );

    res.status(201).json({ 
      status: 201,
      message: 'User registered successfully',
      data: newUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500, 
      message: 'Internal server error',
      data: []
    });
  }
};

// Fungsi Get All Users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        un.name AS university_name, 
        f.name AS faculty_name, 
        m.name AS major_name
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.id
      LEFT JOIN faculties f ON u.faculty_id = f.id
      LEFT JOIN majors m ON u.major_id = m.id
    `);
    
    res.status(200).json({
      status: 200, 
      message: 'Users retrieved successfully', 
      data: users.rows, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
      data: [],
    });
  }
};

// Fungsi Delete User
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (user.rows.length === 0) {
      res.status(404).json({ 
        status: 404,
        message: 'User not found',
        data:[]
    });
      return;
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.status(200).json({ 
        status: 200,
        message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
        status: 500, 
        message: 'Internal server error' 
    });
  }
};

// Fungsi Change Password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1]; // Ambil token dari header Authorization

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'No token provided',
      data: [],
    });
    return;
  }

  try {
    // Verifikasi token dan ambil ID pengguna
    const decoded: any = verifyToken(token);
    if (!decoded) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
        data: [],
      });
      return;
    }

    const userId = decoded.id;

    // Ambil data pengguna berdasarkan ID
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user.rows.length) {
      res.status(404).json({
        status: 'error',
        message: 'User not found',
        data: [],
      });
      return;
    }

    // Periksa apakah password lama sesuai
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!isOldPasswordValid) {
      res.status(400).json({
        status: 'error',
        message: 'Old password is incorrect',
        data: [],
      });
      return;
    }

    // Hash password baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password di database
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
      data: [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      data: [],
    });
  }
};

