// src/components/chat/ChatLayout.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import EmptyState from "./EmptyState";

export default function ChatLayout({ userRole }) {
  const location = useLocation();
  const autoOpenHandled = useRef(false);

  const {
    conversations: allConversations,
    activeConversationId,
    setActiveConversationId,
    setIsChatOpen,
    loadMessages,
    loadConversations,
  } = useChat();

  // On mobile: hide list if a conversation was restored from sessionStorage
  const [isMobileListVisible, setIsMobileListVisible] = useState(!activeConversationId);

  // ── Auto-open conversation when navigated from chat search ───────────────
  useEffect(() => {
    const { openUserId } = location.state || {};
    if (!openUserId || autoOpenHandled.current) return;

    const findOrCreateConversation = async () => {
      autoOpenHandled.current = true;
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const base = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        // First: check if conversation already exists with this user
        const existing = allConversations.find(c =>
          c.other_user_id === openUserId ||
          c.coach_user_id === openUserId ||
          c.customer_user_id === openUserId
        );
        if (existing) {
          setActiveConversationId(existing.id);
          setIsMobileListVisible(false);
          return;
        }

        // Second: try to create/get conversation via the correct endpoint
        const res = await fetch(`${base}/chat/conversations/with/${openUserId}`, {
          method: 'POST',
          headers,
        });
        if (res.ok) {
          const newConv = await res.json();
          await loadConversations();
          setActiveConversationId(newConv.id);
          setIsMobileListVisible(false);
        }
      } catch (err) {
        console.error('Failed to open conversation:', err);
      }
    };

    // Wait for conversations to load before trying
    if (allConversations.length >= 0) {
      findOrCreateConversation();
    }
  }, [location.state, allConversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tell the bridge the chat page is mounted so it suppresses notifications for the active conversation
  useEffect(() => {
    setIsChatOpen(true);
    return () => setIsChatOpen(false);
  }, [setIsChatOpen]);

  // When switching conversations, load messages immediately (don't wait for next poll tick)
  useEffect(() => {
    if (!activeConversationId) return;
    loadMessages(activeConversationId);
    // If the conversation isn't in the list yet (race condition after creation), reload the list
    const found = allConversations.find(c => c.id === activeConversationId);
    if (!found) loadConversations();
  }, [activeConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute directly — no intermediate function, no stale closure risk
  const conversations = allConversations;
  const activeConversation = allConversations.find(c => c.id === activeConversationId) || null;

  // Handle conversation selection
  const handleSelectConversation = (conversationId) => {
    setActiveConversationId(conversationId);
    setIsMobileListVisible(false);
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setIsMobileListVisible(true);
    setActiveConversationId(null);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      {/* Conversation List - Left Side */}
      <div
        className={`${
          isMobileListVisible ? "flex" : "hidden"
        } md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-colors duration-300`}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          userRole={userRole}
        />
      </div>

      {/* Chat Window - Right Side */}
      <div
        className={`${
          !isMobileListVisible ? "flex" : "hidden"
        } md:flex flex-1 flex-col bg-white dark:bg-gray-900 transition-colors duration-300`}
      >
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            onBack={handleBackToList}
            currentUserRole={userRole}
          />
        ) : (
          <EmptyState userRole={userRole} />
        )}
      </div>
    </div>
  );
}