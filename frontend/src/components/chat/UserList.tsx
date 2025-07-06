import React, { useEffect, useState } from 'react';
import type { User } from '../../types';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

interface UserListProps {
  onSelectUser: (user: User) => void;
  selectedUserId?: number;
}

export const UserList: React.FC<UserListProps> = ({ onSelectUser, selectedUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user)}
          className={`w-full p-3 text-left rounded-lg transition-colors ${
            selectedUserId === user.id
              ? 'bg-primary-100 border-primary-500'
              : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {onlineUsers.includes(user.id) && (
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{user.username}</p>
              <p className="text-xs text-gray-500">
                {onlineUsers.includes(user.id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
