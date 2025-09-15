import React from "react";
import Sidebar from "../components/ui/Sidebar";

const Home = () => {
  return (
    <div className="bg-neutral-900 h-dvh w-dvw flex flex-row text-white">
      <Sidebar />
      <div className="flex flex-row gap-5 p-4 flex-wrap">
        <div className="flex flex-col gap-2 w-80 h-70 bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800">
          <div className=" w-full h-1/2 overflow-hidden rounded-2xl">
            <img
              src="https://omcropscience.com/wp-content/uploads/2023/05/Career.jpg"
              alt="img"
              className="w-full h-full"
            />
          </div>
          <div className="px-2 py-1 text-lg">
            <p>Find out perfect career match</p>
          </div>
          <div className="px-2 py-1 text-sm">
            <p>
              Just answer the asked question by our Ai expert and get to know
              your interest and best matching career
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-80 h-70 bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-800">
          <div className=" w-full h-1/2 overflow-hidden rounded-2xl">
            <img
              src="https://bcdn.mindler.com/bloglive/wp-content/uploads/2022/10/19131552/blog-161-770x385.png"
              alt="img"
              className="w-full h-full"
            />
          </div>
          <div className="px-2 py-1 text-lg">
            <p>Find out perfect career by telling your story</p>
          </div>
          <div className="px-2 py-1 text-sm">
            <p>
              Tell us your past story, and our ai expert will try to findout
              your interest and career related to your interest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
