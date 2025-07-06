import React from 'react';
import { Layout } from '../components/common/Layout';
import { ChatRoom } from '../components/chat/ChatRoom';

export const Chat: React.FC = () => {
  return (
    <Layout>
      <ChatRoom />
    </Layout>
  );
};
