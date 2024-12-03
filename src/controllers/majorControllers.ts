import { Request, Response } from 'express';
import pool from '../config/db';


// membuat data jurusan
export const createMajor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, university_name, faculty_name } = req.body;

    // Validasi input
    if (!name || !university_name || !faculty_name) {
      res.status(400).json({ message: 'Name, university_name, and faculty_name are required' });
      return;
    }

    // Cek apakah universitas dan fakultas ada, dan fakultas milik universitas tersebut
    const facultyCheck = await pool.query(
      `
      SELECT f.id AS faculty_id 
      FROM faculties f
      JOIN universities u ON f.university_id = u.id
      WHERE f.name = $1 AND u.name = $2
      `,
      [faculty_name, university_name]
    );

    if (facultyCheck.rowCount === 0) {
      res.status(404).json({ message: 'Faculty not found in the specified university' });
      return;
    }

    const facultyId = facultyCheck.rows[0].faculty_id;

    // Buat jurusan
    const result = await pool.query(
      'INSERT INTO majors (name, faculty_id) VALUES ($1, $2) RETURNING *',
      [name, facultyId]
    );

    res.status(201).json({
      status: 201,
      message: 'Major created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating major:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// melihat data jurusan by univ & fakultas
export const getMajorsByUniversityAndFaculty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Mendapatkan nama universitas dan fakultas dari parameter URL
    const { universityName, facultyName } = req.params;

    // Query untuk mendapatkan jurusan berdasarkan nama universitas dan fakultas
    const query = `
      SELECT m.name AS major_name
      FROM majors m
      JOIN faculties f ON m.faculty_id = f.id
      JOIN universities u ON f.university_id = u.id
      WHERE u.name = $1 AND f.name = $2
    `;
    
    // Jalankan query dan masukkan parameter
    const result = await pool.query(query, [universityName, facultyName]);

    // Jika tidak ada jurusan ditemukan, kirimkan respon 404
    if (result.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'No majors found for the given university and faculty',
      });
      return;
    }

    // Kirimkan hasil jurusan yang ditemukan
    res.status(200).json({
      status: 200,
      message: 'Majors retrieved successfully',
      data: result.rows, // Menampilkan daftar jurusan
    });
  } catch (error) {
    console.error('Error fetching majors:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

export const deleteMajor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { univName, facultyName, majorName } = req.params;

    // Validasi jika nama universitas, fakultas, atau jurusan tidak ditemukan
    if (!univName || !facultyName || !majorName) {
      res.status(400).json({
        status: 400,
        message: 'University name, faculty name, and major name are required',
      });
      return;  // pastikan fungsi berhenti setelah mengirimkan respons
    }

    // Query untuk mencari jurusan berdasarkan nama universitas, fakultas, dan jurusan
    const query = `
      DELETE FROM majors
      WHERE name = $1
        AND faculty_id = (
          SELECT id FROM faculties
          WHERE name = $2
          AND university_id = (
            SELECT id FROM universities WHERE name = $3
          )
        )
      RETURNING *;
    `;
    
    const result = await pool.query(query, [majorName, facultyName, univName]);

    // Jika tidak ada jurusan yang ditemukan dengan kombinasi universitas, fakultas, dan jurusan
    if (result.rowCount === 0) {
      res.status(404).json({
        status: 404,
        message: 'Major not found for the specified university, faculty, and major',
      });
      return;  // pastikan fungsi berhenti setelah mengirimkan respons
    }

    // Jika jurusan berhasil dihapus
    res.status(200).json({
      status: 200,
      message: 'Major deleted successfully',
      data: result.rows[0],  // Mengembalikan jurusan yang dihapus
    });
  } catch (error) {
    console.error('Error deleting major:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};




