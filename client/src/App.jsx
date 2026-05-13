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
import Dashboard from "./pages/Dashboard"
import Calculator from "./pages/calculator"
import Tracker from "./component/Tracker";
import NotFound from "./pages/Notfound";

function App() {

const [user,setUser] = useState(null);

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
setUser(currentUser);
});

return ()=>unsubscribe();

},[]);

return (
  <Routes>

    {/* Pages with Navbar + Footer */}
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
    <Route path="*" element={<NotFound />} />

  </Routes>
);

}

export default App;