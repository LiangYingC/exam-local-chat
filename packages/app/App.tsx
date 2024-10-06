import { Box, CircularProgress } from "@mui/material";
import type { FC } from "react";
import { Suspense, lazy } from "react";
import useUserSessionStore from "./stores/useUserSessionStore";

const ChatRoom = lazy(() => import("./components/ChatRoom"));
const Entrance = lazy(() => import("./components/Entrance"));

const App: FC = () => {
  const userSession = useUserSessionStore((state) => state.userSession);
  const isJoined = Boolean(userSession);

  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          width="100%"
          height="100vh"
        >
          <CircularProgress />
        </Box>
      }
    >
      {isJoined ? <ChatRoom /> : <Entrance />}
    </Suspense>
  );
};

export default App;
