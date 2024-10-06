import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserSession {
  username: string;
  connectionId: string;
}

interface UserSessionState {
  userSession: UserSession | null;
  setLocalUsername: (username: string) => void;
}

const useUserSessionStore = create<UserSessionState>()(
  persist(
    (set) => ({
      userSession: null,
      setLocalUsername: (username: string) =>
        set({ userSession: { username, connectionId: nanoid() } }),
    }),
    {
      name: "user-session-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

export default useUserSessionStore;
