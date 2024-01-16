import { createContext, useMemo, useContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext<any>(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export const SocketProvider = (props: any) => {
    const socket = useMemo(() => io("localhost:8000"), []);

    return <SocketContext.Provider value={socket}>{props.children}</SocketContext.Provider>;
};
