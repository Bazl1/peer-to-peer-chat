import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage/HomePage";
import { SocketProvider } from "./assets/hooks/SocketProvider";

function App() {
    return (
        <Router>
            <SocketProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </SocketProvider>
        </Router>
    );
}

export default App;
