import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ParticipantConnection {
  id: string;
  lastHeartbeatTime: number;
}

interface ParticipantsState {
  participants: {
    [username: string]: {
      connections: ParticipantConnection[];
    };
  };
  addParticipant: (username: string, connectionId: string) => void;
  removeParticipant: (username: string, connectionId: string) => void;
  checkIsFirstJoin: (username: string) => boolean;
  checkIsLastLeave: (username: string) => boolean;
}

const useParticipantsStore = create<ParticipantsState>()(
  persist(
    (set, get) => ({
      participants: {},
      addParticipant: (username, connectionId) =>
        set((state) => {
          if (!username || !connectionId) {
            return state;
          }
          const participant = state.participants[username] || {
            connections: [],
          };
          const newConnection = {
            id: connectionId,
            lastHeartbeatTime: Date.now(),
          };
          return {
            participants: {
              ...state.participants,
              [username]: {
                connections: [...participant.connections, newConnection],
              },
            },
          };
        }),
      removeParticipant: (username, connectionId) =>
        set((state) => {
          const newParticipants = { ...state.participants };
          const participant = newParticipants[username];

          if (!participant) {
            return state;
          }
          const newConnections = participant.connections.filter(
            ({ id }) => id !== connectionId,
          );

          if (newConnections && newConnections.length > 0) {
            newParticipants[username] = {
              ...participant,
              connections: newConnections,
            };
          } else {
            delete newParticipants[username];
          }
          return { participants: newParticipants };
        }),
      checkIsFirstJoin: (username) => {
        const count = get().participants[username]?.connections.length || 0;
        return count === 0;
      },
      checkIsLastLeave: (username) => {
        const count = get().participants[username]?.connections.length || 1;
        return count === 1;
      },
    }),
    {
      name: "participants-storage",
    },
  ),
);

export default useParticipantsStore;
