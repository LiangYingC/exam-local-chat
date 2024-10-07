export enum ChatMessageType {
  Joined = "joined",
  Text = "text",
  Left = "left",
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  type: ChatMessageType;
  sender: string;
  message?: string;
  connectionId?: string;
}

export type ChatMessageWithoutIdAndTimestamp = Omit<
  ChatMessage,
  "id" | "timestamp"
>;
