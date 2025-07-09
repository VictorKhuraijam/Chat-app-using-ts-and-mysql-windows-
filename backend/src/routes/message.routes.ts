import express from 'express';
import {
  sendMessage,
  getConversation,
  getRecentConversations,
  markMessageAsRead,
  getUnreadCount,
  sendMessageValidation,
  deleteMessageById,
  deleteConversation,
  deleteAllUserMessages
} from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', authenticateToken, sendMessageValidation, sendMessage);
router.get('/conversations', authenticateToken, getRecentConversations);
router.get('/conversation/:userId', authenticateToken, getConversation);
router.put('/read/:messageId', authenticateToken, markMessageAsRead);
router.get('/unread-count', authenticateToken, getUnreadCount);

router.delete('/:messageId', authenticateToken, deleteMessageById);
router.delete('/conversations/:userId', authenticateToken, deleteConversation);
router.delete('/user/all', authenticateToken, deleteAllUserMessages);

export default router;
