import React, { useState } from "react";
import {
  CircleUser,
  MessagesSquare,
  PanelLeftClose,
  TrendingUp,
  Waypoints,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`bg-neutral-950 h-dvh ${
        isOpen ? "w-2/3 lg:w-1/6" : "w-16"
      } p-2 flex flex-col text-white transition-all duration-300 fixed lg:static z-40`}
    >
      {/* Header */}
      <div className="font-medium text-2xl p-2 flex flex-row justify-between items-center">
        {isOpen && <p>Disha Genesis</p>}
        <PanelLeftClose
          className="cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {/* Main Buttons */}
      <div className="flex-1">
        <div className="flex flex-col gap-2 mt-10">
          <button
            onClick={() => navigate("/chat")}
            className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl"
          >
            <MessagesSquare size={16} />
            {isOpen && <span>Let's chat</span>}
          </button>
          <button className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl">
            <Waypoints size={16} />
            {isOpen && <span>Find right career</span>}
          </button>
          <button className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl">
            <TrendingUp size={16} />
            {isOpen && <span>Trending careers</span>}
          </button>
        </div>
      </div>

      {/* Footer User */}
      <div className="p-2 flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 px-4 rounded-xl">
        <CircleUser />
        {isOpen && <p>Prashant Thakur</p>}
      </div>
    </div>
  );
};

export default Sidebar;
