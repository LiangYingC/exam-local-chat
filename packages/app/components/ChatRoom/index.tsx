import { Box, TextField } from "@mui/material";
import type { ChangeEvent, FC, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import useChatMessagesStore from "../../stores/useChatMessagesStore";
import useParticipantsStore from "../../stores/useParticipantsStore";
import useUserSessionStore from "../../stores/useUserSessionStore";
import type { ChatMessageWithoutIdAndTimestamp } from "../../types/message";
import { ChatMessageType } from "../../types/message";
import channel from "../../utils/broadcastChannel";
import Layout from "../Layout";
import Messages from "./Messages";

const ChatRoom: FC = () => {
  const userSession = useUserSessionStore((state) => state.userSession);
  const localUsername = userSession?.username || "";
  const localUserConnectionId = userSession?.connectionId || "";

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
  } = useParticipantsStore();

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

  useEffect(() => {
    channel.onmessage = (event) => {
      if (!event.data) return;
      const { type, username, connectionId } = event.data;
      switch (type) {
        case ChatMessageType.Joined:
          if (checkIsFirstJoin(username)) {
            receiveChatMessage(event.data);
          }
          addParticipant(username, connectionId);
          break;
        case ChatMessageType.Left:
          if (checkIsLastLeave(username)) {
            receiveChatMessage(event.data);
          }
          removeParticipant(username, connectionId);
          break;
        default:
          receiveChatMessage(event.data);
      }
    };
    return () => {
      channel.onmessage = null;
    };
  }, [
    addParticipant,
    removeParticipant,
    receiveChatMessage,
    checkIsFirstJoin,
    checkIsLastLeave,
  ]);

  useEffect(() => {
    if (!isSentJoinedMessageRef.current) {
      isSentJoinedMessageRef.current = true;
      sendChatMessage({
        type: ChatMessageType.Joined,
        username: localUsername,
        connectionId: localUserConnectionId,
        shouldUpdateStore: checkIsFirstJoin(localUsername),
      });
      addParticipant(localUsername, localUserConnectionId);
    }
  }, [
    localUsername,
    localUserConnectionId,
    sendChatMessage,
    checkIsFirstJoin,
    addParticipant,
  ]);

  useEffect(() => {
    const handleLeave = () => {
      sendChatMessage({
        type: ChatMessageType.Left,
        username: localUsername,
        connectionId: localUserConnectionId,
        shouldUpdateStore: checkIsLastLeave(localUsername),
      });
      removeParticipant(localUsername, localUserConnectionId);
    };
    window.addEventListener("beforeunload", handleLeave);
    return () => {
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [
    localUsername,
    localUserConnectionId,
    sendChatMessage,
    checkIsLastLeave,
    removeParticipant,
  ]);

  return (
    <Layout title="輸入訊息，隨性交流">
      <Messages
        shouldAutoScrollToBottom={shouldAutoScrollToBottom}
        setShouldAutoScrollToBottom={setShouldAutoScrollToBottom}
      />
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
