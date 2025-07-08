import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { MessageModel } from '../models/Message.model';
import { UserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const sendMessageValidation = [
  body('receiver_id').isInt().withMessage('Valid receiver ID required'),
  body('content').notEmpty().withMessage('Message content required'),
  body('message_type').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
];

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { receiver_id, content, message_type } = req.body;
    const sender_id = req.user!.id;

    // Check if receiver exists
    const receiver = await UserModel.findById(receiver_id);
    if (!receiver) {
      res.status(404).json({ error: 'Receiver not found' });
      return;
    }

    // Create message
    const message = await MessageModel.create({
      sender_id,
      receiver_id,
      content,
      message_type: message_type || 'text'
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const otherUserId = parseInt(userId);
    if (isNaN(otherUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }
    console.log('[getConversation Controller] sender:', req.user!.id, 'receiver:', otherUserId);


    const messages = await MessageModel.getConversation(req.user!.id, otherUserId, limit);

    res.json({
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecentConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const conversations = await MessageModel.getRecentConversations(req.user!.id);

    res.json({
      conversations
    });
  } catch (error) {
    console.error('Get recent conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessageAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;

    await MessageModel.markAsRead(parseInt(messageId));

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await MessageModel.getUnreadCount(req.user!.id);

    res.json({ unread_count: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
