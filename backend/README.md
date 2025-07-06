# Chat App Backend

A real-time chat application backend built with TypeScript, Express.js, Socket.IO, and MySQL.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Real-time Messaging**: WebSocket-based real-time messaging using Socket.IO
- **Message History**: Persistent message storage with conversation history
- **Online Status**: Real-time user online/offline status tracking
- **Typing Indicators**: Live typing indicators during conversations
- **Message Read Status**: Track and mark messages as read
- **Rate Limiting**: API rate limiting for security
- **Input Validation**: Comprehensive input validation and sanitization
- **Security**: Helmet.js for security headers, CORS configuration

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL with mysql2 driver
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: helmet, cors, bcryptjs
- **Development**: nodemon, ts-node

## Project Structure

```
src/
├── config/
│   └── database.ts          # Database configuration
├── controllers/
│   ├── authController.ts    # Authentication logic
│   ├── messageController.ts # Message handling
│   └── userController.ts    # User management
├── middleware/
│   └── auth.ts              # JWT authentication middleware
├── models/
│   ├── User.ts              # User model and queries
│   └── Message.ts           # Message model and queries
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── messages.ts          # Message routes
│   └── users.ts             # User routes
├── socket/
│   └── socketHandlers.ts    # Socket.IO event handlers
├── database/
│   └── schema.sql           # Database schema
└── server.ts                # Main server file
```

## Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd chat-app-backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=chat_app
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. **Set up the database**:
```bash
# Create database and tables
mysql -u root -p < src/database/schema.sql
```

5. **Build the project**:
```bash
npm run build
```

6. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile

### Messages
- `POST /api/messages` - Send a message
- `GET /api/messages/conversations` - Get recent conversations
- `GET /api/messages/conversation/:userId` - Get conversation with specific user
- `PUT /api/messages/:messageId/read` - Mark message as read
- `GET /api/messages/unread-count` - Get unread message count

### Users
- `GET /api/users` - Get all users (excluding current user)

### Health Check
- `GET /api/health` - Server health check

## Socket.IO Events

### Client to Server Events
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `mark_message_read` - Mark message as read

### Server to Client Events
- `new_message` - New message received
- `message_notification` - Message notification
- `message_sent` - Message sent confirmation
- `user_typing` - Typing indicator
- `message_read_confirmed` - Message read confirmation
- `user_offline` - User went offline
- `error` - Error occurred

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Socket.IO connections also require authentication through the `auth` object:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: Hashed password
- `avatar`: Profile picture URL (optional)
- `is_online`: Online status
- `last_seen`: Last activity timestamp
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Messages Table
- `id`: Primary key
- `sender_id`: Foreign key to users table
- `receiver_id`: Foreign key to users table
- `content`: Message content
- `message_type`: Type of message (text, image, file)
- `is_read`: Read status
- `created_at`: Message creation timestamp
- `updated_at`: Last update timestamp

## Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse with request rate limiting
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configured for specific origins
- **Helmet**: Security headers for enhanced protection
- **SQL Injection Protection**: Parameterized queries

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Environment Variables
Make sure to set all required environment variables in your `.env` file before running the application.

## Client Integration Example

### Authentication
```javascript
// Register
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'securepassword'
  })
});

// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securepassword'
  })
});

const { token } = await loginResponse.json();
```

### Socket.IO Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Join conversation
socket.emit('join_conversation', otherUserId);

// Send message
socket.emit('send_message', {
  receiver_id: otherUserId,
  content: 'Hello there!',
  message_type: 'text'
});

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Valid email required"
    }
  ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

