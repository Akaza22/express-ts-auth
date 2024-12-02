import { Request, Response } from 'express';
import pool from '../config/db';


interface Major {
  name: string;
}

interface Faculty {
  faculty_id: number;
  faculty_name: string;
  majors: string[];
}

interface University {
  university_id: number;
  university_name: string;
  faculties: Faculty[];
  user_count: number;
}




// Fungsi untuk mengambil semua data universitas
export const getAllUniversities = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
          u.id AS university_id,
          u.name AS university_name,
          COUNT(DISTINCT us.id) AS user_count, 
          f.id AS faculty_id,
          f.name AS faculty_name,
          m.name AS major_name
      FROM universities u
      LEFT JOIN faculties f ON u.id = f.university_id
      LEFT JOIN majors m ON f.id = m.faculty_id
      LEFT JOIN users us ON u.id = us.university_id 
      GROUP BY u.id, f.id, m.name
      ORDER BY u.id, f.id, m.name;
    `);

    const rawData = result.rows;

    const universities: University[] = rawData.reduce((acc: University[], row) => {
      let university = acc.find((u) => u.university_id === row.university_id);
      if (!university) {
        university = {
          university_id: row.university_id,
          university_name: row.university_name,
          user_count: Number(row.user_count), 
          faculties: [],
        };
        acc.push(university);
      }

      let faculty = university.faculties.find((f) => f.faculty_id === row.faculty_id);
      if (!faculty) {
        faculty = {
          faculty_id: row.faculty_id,
          faculty_name: row.faculty_name,
          majors: [],
        };
        university.faculties.push(faculty);
      }

      if (row.major_name) {
        faculty.majors.push(row.major_name);
      }

      return acc;
    }, []);

    res.status(200).json({
      status: 200,
      message: 'Universities retrieved successfully',
      data: universities,
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

//Fungsi untuk membuat data universitas
export const createUniversity = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      status: 400,
      message: 'University name is required',
    });
    return;
  }

  try {
    const newUniversity = await pool.query(
      'INSERT INTO universities (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json({
      status: 201,
      message: 'University created successfully',
      data: newUniversity.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

//Fungsi untuk menghapus data universitas
export const deleteUniversity = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const deletedUniversity = await pool.query(
      'DELETE FROM universities WHERE id = $1 RETURNING *',
      [id]
    );

    if (!deletedUniversity.rows.length) {
      res.status(404).json({
        status: 404,
        message: 'University not found',
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: 'University deleted successfully',
      data: deletedUniversity.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

//Fungsi untuk edit data universitas
export const editUniversity = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      status: 400,
      message: 'University name is required',
    });
    return;
  }

  try {
    const updatedUniversity = await pool.query(
      'UPDATE universities SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (!updatedUniversity.rows.length) {
      res.status(404).json({
        status: 404,
        message: 'University not found',
      });
      return;
    }

    res.status(200).json({
      status: 200,
      message: 'University updated successfully',
      data: updatedUniversity.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

