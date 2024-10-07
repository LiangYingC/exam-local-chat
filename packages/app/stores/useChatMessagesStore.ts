import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ChatMessage,
  ChatMessageWithoutIdAndTimestamp,
} from "../types/message";
import { broadCastChatMessage } from "../utils/broadcastChannel";

interface SendChatMessageParams extends ChatMessageWithoutIdAndTimestamp {
  shouldUpdateStore?: boolean;
}

interface ChatMessagesState {
  chatMessages: ChatMessage[];
  sendChatMessage: (params: SendChatMessageParams) => void;
  receiveChatMessage: (message: ChatMessage) => void;
}

export const useChatMessagesStore = create<ChatMessagesState>()(
  persist(
    (set) => ({
      chatMessages: [],
      sendChatMessage: ({
        type,
        sender,
        message = "",
        connectionId = "",
        shouldUpdateStore = true,
      }) => {
        const newMessage: ChatMessage = {
          id: nanoid(),
          timestamp: Date.now(),
          type,
          sender,
          message,
          connectionId,
        };
        broadCastChatMessage(newMessage);
        if (shouldUpdateStore) {
          set((state) => ({
            chatMessages: [...state.chatMessages, newMessage],
          }));
        }
      },
      receiveChatMessage: (newMessage: ChatMessage) => {
        set((state) => {
          const isExisting = state.chatMessages.some(
            (msg) => msg.id === newMessage.id,
          );
          if (isExisting) {
            return state;
          }
          return {
            chatMessages: [...state.chatMessages, newMessage],
          };
        });
      },
    }),
    {
      name: "chat-messages-storage",
    },
  ),
);

export default useChatMessagesStore;
