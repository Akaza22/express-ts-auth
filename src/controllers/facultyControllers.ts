import { Request, Response } from 'express';
import pool from '../config/db'; // Pastikan koneksi database sudah benar

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
