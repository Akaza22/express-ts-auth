import { Request, Response } from 'express';
import pool from '../config/db'; // Pastikan koneksi database sudah benar


// melihat semua fakultas
export const getAllFaculties = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
          f.id AS faculty_id,
          f.name AS faculty_name,
          u.id AS university_id,
          u.name AS university_name,
          COUNT(us.id) AS user_count
      FROM faculties f
      LEFT JOIN universities u ON f.university_id = u.id
      LEFT JOIN users us ON f.id = us.faculty_id
      GROUP BY f.id, f.name, u.id, u.name
      ORDER BY u.id, f.id;
    `);

    const faculties = result.rows;

    res.status(200).json({
      status: 200,
      message: 'Faculties retrieved successfully',
      data: faculties,
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

// membuat data fakultas
export const createFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faculty_name, university_name } = req.body;

    // Validasi input
    if (!faculty_name || !university_name) {
      res.status(400).json({
        status: 400,
        message: 'Faculty name and university name are required',
      });
      return;
    }

    // Cari university berdasarkan nama
    const universityQuery = await pool.query(
      'SELECT id FROM universities WHERE name = $1',
      [university_name]
    );

    if (universityQuery.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'University not found',
      });
      return;
    }

    const university_id = universityQuery.rows[0].id;

    // Periksa apakah fakultas sudah ada di universitas ini
    const existingFaculty = await pool.query(
      'SELECT * FROM faculties WHERE name = $1 AND university_id = $2',
      [faculty_name, university_id]
    );

    // Gunakan pengecekan eksplisit untuk properti rowCount
    if (existingFaculty?.rowCount && existingFaculty.rowCount > 0) {
      res.status(409).json({
        status: 409,
        message: 'Faculty already exists in the selected university',
      });
      return;
    }

    // Tambahkan fakultas ke tabel
    const result = await pool.query(
      'INSERT INTO faculties (name, university_id) VALUES ($1, $2) RETURNING *',
      [faculty_name, university_id]
    );

    res.status(201).json({
      status: 201,
      message: 'Faculty created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

// menghapus data fakultas
export const deleteFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faculty_name, university_name } = req.body;

    // Validasi input
    if (!faculty_name || !university_name) {
      res.status(400).json({
        status: 400,
        message: 'Faculty name and university name are required',
      });
      return;
    }

    // Cari university berdasarkan nama
    const universityQuery = await pool.query(
      'SELECT id FROM universities WHERE name = $1',
      [university_name]
    );

    if (universityQuery.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'University not found',
      });
      return;
    }

    const university_id = universityQuery.rows[0].id;

    // Periksa apakah fakultas ada
    const facultyQuery = await pool.query(
      'SELECT * FROM faculties WHERE name = $1 AND university_id = $2',
      [faculty_name, university_id]
    );

    if (facultyQuery.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'Faculty not found in the specified university',
      });
      return;
    }

    // Hapus fakultas
    await pool.query('DELETE FROM faculties WHERE name = $1 AND university_id = $2', [
      faculty_name,
      university_id,
    ]);

    res.status(200).json({
      status: 200,
      message: 'Faculty deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

// melihat fakultas berdasarkan nama universitas
export const getFacultiesByUniversity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { university_name } = req.params;

    // Validasi input
    if (!university_name) {
      res.status(400).json({
        status: 400,
        message: 'University name is required',
      });
      return;
    }

    // Cari university berdasarkan nama
    const universityQuery = await pool.query(
      'SELECT id FROM universities WHERE name = $1',
      [university_name]
    );

    if (universityQuery.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'University not found',
      });
      return;
    }

    const university_id = universityQuery.rows[0].id;

    // Ambil daftar fakultas berdasarkan university_id
    const facultiesQuery = await pool.query(
      `
      SELECT 
        f.id AS faculty_id,
        f.name AS faculty_name,
        COUNT(u.id) AS user_count
      FROM faculties f
      LEFT JOIN users u ON u.faculty_id = f.id
      WHERE f.university_id = $1
      GROUP BY f.id
      ORDER BY f.name
      `,
      [university_id]
    );

    res.status(200).json({
      status: 200,
      message: 'Faculties retrieved successfully',
      data: facultiesQuery.rows, // Mengembalikan daftar fakultas
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

// edit data fakultas
export const editFaculty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { faculty_id } = req.params; // ID Fakultas dari URL
    const { name } = req.body; // Nama fakultas baru

    // Validasi input
    if (!faculty_id || !name) {
      res.status(400).json({
        status: 400,
        message: 'Faculty ID and new name are required',
      });
      return;
    }

    // Validasi apakah fakultas dengan ID tersebut ada
    const facultyCheck = await pool.query(
      'SELECT * FROM faculties WHERE id = $1',
      [faculty_id]
    );

    if (facultyCheck.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'Faculty not found',
      });
      return;
    }

    // Update nama fakultas
    const result = await pool.query(
      'UPDATE faculties SET name = $1 WHERE id = $2 RETURNING *',
      [name, faculty_id]
    );

    res.status(200).json({
      status: 200,
      message: 'Faculty updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};
