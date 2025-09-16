import { Send } from "lucide-react";
import React from "react";

const Chat = () => {
  return (
    <div className="w-dvw h-dvh bg-neutral-900 text-white flex justify-center items-center">
      <div className="flex flex-col justify-between h-full lg:w-1/2 p-4">
        <div className="w-full flex gap-4 flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1">
          <p className="flex ml-auto py-2 px-2 bg-neutral-800 rounded-2xl max-w-[90%] rounded-tr-none">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Id
            molestias reprehenderit aperiam voluptas, accusamus porro ullam
            numquam repellendus dolor officia tenetur, saepe enim incidunt
            explicabo? Ipsa, optio quos. Natus, fugiat!
          </p>
          <p className="flex mr-auto py-2 px-2 rounded-2xl">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla
            commodi odit cumque delectus animi esse ab iure ex optio eveniet
            corporis laudantium dolor, officia amet soluta rerum vero dolorem
            sit?
          </p>
          
        </div>
        <div className="flex flex-row bg-neutral-800 rounded-4xl overflow-hidden p-2 h-18 shadow-2xl shadow-neutral-950 border border-neutral-800/80">
          <textarea
            className="px-4 py-3 resize-none row-end-1 rounded-4xl flex-1 outline-0"
            rows={1}
            name=""
            id=""
            placeholder="Type here..."
          ></textarea>
          <button className="flex my-auto cursor-pointer  bg-neutral-700 rounded-full p-3">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
