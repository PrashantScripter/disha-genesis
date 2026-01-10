import React, { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// import LandingPage from "./pages/LandingPage";
const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<LandingPage />} /> */}
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
