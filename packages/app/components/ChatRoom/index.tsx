import { Box, TextField } from "@mui/material";
import type { ChangeEvent, FC, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import useIntersectionObserver from "../../hooks/useIntersectionObserver";
import useChatMessagesStore from "../../stores/useChatMessagesStore";
import useLocalUserStore from "../../stores/useLocalUserStore";
import useParticipantCountsStore from "../../stores/useParticipantCountsStore";
import type { ChatMessageWithoutIdAndTimestamp } from "../../types/message";
import { ChatMessageType } from "../../types/message";
import channel from "../../utils/broadcastChannel";
import Layout from "../Layout";
import Message from "./Message";

const ChatRoom: FC = () => {
  const localUsername = useLocalUserStore((state) => state.localUsername);
  const chatMessages = useChatMessagesStore((state) => state.chatMessages);
  const sendChatMessage = useChatMessagesStore(
    (state) => state.sendChatMessage,
  );
  const receiveChatMessage = useChatMessagesStore(
    (state) => state.receiveChatMessage,
  );

  const {
    addParticipant,
    removeParticipant,
    checkIsFirstJoin,
    checkIsLastLeave,
  } = useParticipantCountsStore();

  const isSentJoinedMessageRef = useRef<boolean>(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [shouldAutoScrollToBottom, setShouldAutoScrollToBottom] =
    useState(true);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (textInputRef.current) {
      textInputRef.current.value = e.target.value;
    }
  }, []);

  const handleSendMessage = (e: KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      textInputRef.current &&
      textInputRef.current.value.trim() &&
      !e.shiftKey
    ) {
      e.preventDefault();
      const newMessage: ChatMessageWithoutIdAndTimestamp = {
        type: ChatMessageType.Text,
        username: localUsername,
        message: textInputRef.current.value,
      };
      textInputRef.current.value = "";
      sendChatMessage(newMessage);
      setShouldAutoScrollToBottom(true);
    }
  };

  const { rootRef: chatBoxRef, targetRef: messagesEndRef } =
    useIntersectionObserver<HTMLDivElement>({
      onIntersect: (isIntersecting) =>
        setShouldAutoScrollToBottom(isIntersecting),
    });

  useEffect(() => {
    if (shouldAutoScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, shouldAutoScrollToBottom, messagesEndRef]);

  useEffect(() => {
    channel.onmessage = (event) => receiveChatMessage(event.data);
    return () => {
      channel.onmessage = null;
    };
  }, [receiveChatMessage]);

  useEffect(() => {
    if (!isSentJoinedMessageRef.current) {
      isSentJoinedMessageRef.current = true;
      if (checkIsFirstJoin(localUsername)) {
        sendChatMessage({
          type: ChatMessageType.Joined,
          username: localUsername,
        });
      }
      addParticipant(localUsername);
    }
  }, [localUsername, sendChatMessage, checkIsFirstJoin, addParticipant]);

  useEffect(() => {
    const handleLeave = () => {
      if (checkIsLastLeave(localUsername)) {
        sendChatMessage({
          type: ChatMessageType.Left,
          username: localUsername,
        });
      }
      removeParticipant(localUsername);
    };
    window.addEventListener("beforeunload", handleLeave);
    return () => {
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [localUsername, sendChatMessage, checkIsLastLeave, removeParticipant]);

  return (
    <Layout title="輸入訊息，隨性交流">
      <Box
        ref={chatBoxRef}
        sx={{
          width: "100%",
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          border: "1px solid",
          borderColor: "primary.contrastText",
          borderRadius: 2,
          whiteSpace: "pre",
        }}
      >
        {chatMessages.map((chatMessage) => (
          <Message
            key={chatMessage.id}
            localUsername={localUsername}
            chatMessage={chatMessage}
          />
        ))}
        <div ref={messagesEndRef} style={{ height: "1px" }} />
      </Box>
      <Box
        component="form"
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <TextField
          multiline
          inputRef={textInputRef}
          placeholder="輸入訊息，按 Enter 發送"
          type="text"
          onChange={handleInputChange}
          onKeyDown={handleSendMessage}
          fullWidth
        />
      </Box>
    </Layout>
  );
};

export default ChatRoom;
