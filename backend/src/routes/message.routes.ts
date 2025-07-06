import express from 'express';
import {
  sendMessage,
  getConversation,
  getRecentConversations,
  markMessageAsRead,
  getUnreadCount,
  sendMessageValidation
} from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticateToken, sendMessageValidation, sendMessage);
router.get('/conversations', authenticateToken, getRecentConversations);
router.get('/conversation/:userId', authenticateToken, getConversation);
router.put('/read/:messageId', authenticateToken, markMessageAsRead);
router.get('/unread-count', authenticateToken, getUnreadCount);

export default router;
