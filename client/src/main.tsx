import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./assets/styles/global.scss";
import { SocketProvider } from "./assets/hooks/SocketProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <SocketProvider>
        <App />
    </SocketProvider>,
);
