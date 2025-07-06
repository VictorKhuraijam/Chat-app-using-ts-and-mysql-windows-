import { Response } from 'express';
import { UserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserModel.getAllUsers(req.user!.id);

    res.json({
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        is_online: user.is_online,
        last_seen: user.last_seen
      }))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
