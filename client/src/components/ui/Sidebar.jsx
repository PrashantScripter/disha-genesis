import React from "react";
import { CircleUser, MessagesSquare, PanelLeftClose, TrendingUp, Waypoints } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="bg-neutral-950 h-dvh w-1/6 p-2 flex flex-col text-white">
      <div className=" font-medium text-2xl p-2 flex flex-row justify-between items-center">
        <p>Disha Genesis</p>
        <PanelLeftClose className="cursor-pointer" />
      </div>
      <div className="flex-1">
        <div className="flex flex-col gap-2 mt-10">
          <button className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl">
            <MessagesSquare size={16} />
            Let's chat
          </button>
          <button className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl">
            <Waypoints size={16} />
            Find right career
          </button>
          <button className="text-start text-sm flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 p-2 px-4 rounded-xl">
            <TrendingUp size={16} />
            Trending careers
          </button>
        </div>
      </div>
      <div className="p-2 flex flex-row gap-2 items-center cursor-pointer hover:bg-neutral-800 px-4 rounded-xl">
        <CircleUser />
        <p>Prashant Thakur</p>
      </div>
    </div>
  );
};

export default Sidebar;
