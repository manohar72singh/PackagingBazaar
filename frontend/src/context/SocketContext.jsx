import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAuthState } from "../utils/auth";
import { useNotification } from "./NotificationContext";
import { API_BASE_URL } from "../services/api";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { id: userId } = getAuthState();
  const { notifyInfo } = useNotification();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userId) {
      const newSocket = io(API_BASE_URL, {
        query: { userId },
      });

      setSocket(newSocket);

      newSocket.on("new_notification", (notification) => {
        // Play notification sound
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
        audio.play().catch(e => console.log("Audio play failed:", e));

        notifyInfo(`${notification.title}: ${notification.message}`);
        setUnreadCount((prev) => prev + 1);
      });

      // Initial fetch of unread count
      fetchUnreadCount();

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [userId]);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, fetchUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
