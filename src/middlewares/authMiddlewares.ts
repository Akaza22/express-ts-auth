import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwtHelper';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: 'Authorization header missing' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded; // Simpan data user ke request
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};
