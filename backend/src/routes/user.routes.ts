import express from 'express';
import { getAllUsers } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticateToken, getAllUsers);

export default router;
