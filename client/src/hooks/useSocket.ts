import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';


export const useSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (token) {
      const newSocket = io(API_BASE_URL, {
        auth: { token }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  return socket;
};
