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
import Dashboard from"./pages/Dashboard";

function App() {

const [user,setUser] = useState(null);

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
setUser(currentUser);
});

return ()=>unsubscribe();

},[]);

return (
<>
<Navbar user={user} />

<Routes>
<Route path="/" element={<Home />} />
<Route path="/about" element={<About />} />
<Route path="/donate" element={<Donate />} />
<Route path="/contact" element={<Contact />} />
<Route path="/login" element={<Login />} />
<Route path="/dashboard" element={<Dashboard/>}/>
</Routes>

<Footer />
</>
);

}

export default App;