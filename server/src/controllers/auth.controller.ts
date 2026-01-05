import { Request, Response } from 'express';
import { loginAdmin } from '../service/auth.service';


export const login = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        message: 'Password is required',
      });
    }

    const token = await loginAdmin(password);

    if (!token) {
      return res.status(401).json({
        message: 'Invalid password',
      });
    }

    res.status(200).json({
      accessToken: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
};
