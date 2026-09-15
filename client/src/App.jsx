import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";

import Navbar from "./component/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Donate from "./pages/Donate";
import Contact from "./pages/Contact";
import Footer from "./component/Footer";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calculator from "./pages/calculator";
import Tracker from "./component/Tracker";
import NotFound from "./pages/Notfound";
import OfflineGame from "./component/offlineGame";
import Chatbot from "./component/chatbot/Chatbot";

function App() {

    const [user, setUser] = useState(null);

    // Online / Offline state
    const [isOnline, setIsOnline] = useState(
        navigator.onLine
    );

    // Firebase authentication
    useEffect(() => {

        const unsubscribe = onAuthStateChanged(
            auth,
            (currentUser) => {
                setUser(currentUser);
            }
        );

        return () => unsubscribe();

    }, []);

    // Detect internet connection
    useEffect(() => {

        const handleOnline = () => {
            setIsOnline(true);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener(
            "online",
            handleOnline
        );

        window.addEventListener(
            "offline",
            handleOffline
        );

        return () => {

            window.removeEventListener(
                "online",
                handleOnline
            );

            window.removeEventListener(
                "offline",
                handleOffline
            );

        };

    }, []);

    // If internet is unavailable,
    // show the offline game
    if (!isOnline) {
        return <OfflineGame />;
    }

    return (
        <>
            <Routes>

                {/* Home */}
                <Route
                    path="/"
                    element={
                        <>
                            <Navbar user={user} />
                            <Home />
                            <Footer />
                        </>
                    }
                />

                {/* About */}
                <Route
                    path="/about"
                    element={
                        <>
                            <Navbar user={user} />
                            <About />
                            <Footer />
                        </>
                    }
                />

                {/* Donate */}
                <Route
                    path="/donate"
                    element={
                        <>
                            <Navbar user={user} />
                            <Donate />
                            <Footer />
                        </>
                    }
                />

                {/* Contact */}
                <Route
                    path="/contact"
                    element={
                        <>
                            <Navbar user={user} />
                            <Contact />
                            <Footer />
                        </>
                    }
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={
                        <>
                            <Navbar user={user} />
                            <Login />
                            <Footer />
                        </>
                    }
                />

                {/* Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <>
                            <Navbar user={user} />
                            <Dashboard />
                            <Footer />
                        </>
                    }
                />

                {/* Calculator */}
                <Route
                    path="/calculator"
                    element={
                        <>
                            <Navbar user={user} />
                            <Calculator />
                            <Footer />
                        </>
                    }
                />

                {/* Tracker */}
                <Route
                    path="/tracker"
                    element={
                        <>
                            <Navbar user={user} />
                            <Tracker />
                            <Footer />
                        </>
                    }
                />

                {/* Not Found */}
                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>

            {/* 🌱 NEW — Vasudha Assistant */}
            <Chatbot />

        </>
    );
}

export default App;