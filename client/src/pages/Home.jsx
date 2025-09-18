import React from "react";
import Sidebar from "../components/ui/Sidebar";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-900 h-dvh w-dvw flex flex-row text-white">
      <Sidebar />
      <div className="flex flex-row gap-5 p-4 flex-wrap">

        {/* Card 1 - Student knows their interests */}
        <div
          onClick={() => navigate("/chat")}
          className="flex flex-col gap-2 w-80 h-70 bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800 hover:border-blue-500 transition"
        >
          <div className="w-full h-1/2 overflow-hidden rounded-2xl">
            <img
              src="https://omcropscience.com/wp-content/uploads/2023/05/Career.jpg"
              alt="Career Options"
              className="w-full h-full"
            />
          </div>
          <div className="px-2 py-1 text-lg font-bold">I know about my interests</div>
          <div className="px-2 py-1 text-sm">
            <p>
              Choose your field (Law, Tech, Business) and play quizzes
              according to your level (Beginner → Advanced).
            </p>
          </div>
        </div>

        {/* Card 2 - Student doesn’t know their interests */}
        <div
          onClick={() => navigate("/quiz/mixed")}
          className="flex flex-col gap-2 w-80 h-70 bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800 hover:border-green-500 transition"
        >
          <div className="w-full h-1/2 overflow-hidden rounded-2xl">
            <img
              src="https://bcdn.mindler.com/bloglive/wp-content/uploads/2022/10/19131552/blog-161-770x385.png"
              alt="Discover Interests"
              className="w-full h-full"
            />
          </div>
          <div className="px-2 py-1 text-lg font-bold">I don’t know about my interests</div>
          <div className="px-2 py-1 text-sm">
            <p>
              Get a mix of quizzes from Law, Tech, and Business to discover
              where your interest lies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
