import React, { useState, useEffect } from "react";
import {
  CircleUser,
  MessagesSquare,
  PanelLeftClose,
  TrendingUp,
  Waypoints,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false); // Close sidebar by default on mobile
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Overlay component for mobile
  const Overlay = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={toggleSidebar}
    />
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && <Overlay />}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? "fixed" : "relative"} 
          ${isMobile ? "z-50" : "z-10"}
          bg-neutral-950 h-dvh transition-all duration-300 ease-in-out
          ${
            isOpen
              ? isMobile
                ? "w-72 translate-x-0"
                : "w-72"
              : isMobile
              ? "w-72 -translate-x-full"
              : "w-16"
          }
          ${isMobile ? "top-0 left-0" : ""}
          p-2 flex flex-col text-white
        `}
      >
        {/* Header */}
        <div className="font-medium text-2xl p-2 flex flex-row gap-5 justify-between items-center min-h-[3.5rem]">
          {(isOpen || !isMobile) && (
            <p className={`${isOpen ? "block" : "hidden"} truncate`}>
              Disha Genesis
            </p>
          )}
          <button
            onClick={toggleSidebar}
            className="cursor-pointer hover:bg-neutral-800 p-1 rounded-lg transition-colors"
          >
            {isMobile ? (
              isOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )
            ) : (
              <PanelLeftClose
                size={20}
                className={`transition-transform duration-300 ${
                  isOpen ? "rotate-0" : "rotate-180"
                }`}
              />
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 mt-10">
            <button
              onClick={() => {
                navigate("/chat");
                isMobile && setIsOpen(false);
              }}
              className="text-start text-sm flex flex-row gap-3 items-center cursor-pointer hover:bg-neutral-800 p-3 rounded-xl transition-all duration-200 group"
            >
              <MessagesSquare
                size={18}
                className="flex-shrink-0 group-hover:scale-110 transition-transform"
              />
              <span
                className={`${
                  isOpen ? "block" : "hidden"
                } whitespace-nowrap overflow-hidden`}
              >
                Let's chat
              </span>
            </button>

            <button
              className="text-start text-sm flex flex-row gap-3 items-center cursor-pointer hover:bg-neutral-800 p-3 rounded-xl transition-all duration-200 group"
              onClick={() => isMobile && setIsOpen(false)}
            >
              <Waypoints
                size={18}
                className="flex-shrink-0 group-hover:scale-110 transition-transform"
              />
              <span
                className={`${
                  isOpen ? "block" : "hidden"
                } whitespace-nowrap overflow-hidden`}
              >
                Find right career
              </span>
            </button>

            <button
              className="text-start text-sm flex flex-row gap-3 items-center cursor-pointer hover:bg-neutral-800 p-3 rounded-xl transition-all duration-200 group"
              onClick={() => isMobile && setIsOpen(false)}
            >
              <TrendingUp
                size={18}
                className="flex-shrink-0 group-hover:scale-110 transition-transform"
              />
              <span
                className={`${
                  isOpen ? "block" : "hidden"
                } whitespace-nowrap overflow-hidden`}
              >
                Trending careers
              </span>
            </button>
          </div>
        </div>

        {/* Footer User Profile */}
        <div
          className="p-3 flex flex-row gap-3 items-center cursor-pointer hover:bg-neutral-800 rounded-xl transition-all duration-200 group mt-auto"
          onClick={() => isMobile && setIsOpen(false)}
        >
          <CircleUser
            size={20}
            className="flex-shrink-0 group-hover:scale-110 transition-transform"
          />
          <p
            className={`${
              isOpen ? "block" : "hidden"
            } whitespace-nowrap overflow-hidden text-sm`}
          >
            Prashant Thakur
          </p>
        </div>
      </div>

      {/* Mobile menu button for when sidebar is closed */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 bg-neutral-950 text-white p-2 rounded-lg shadow-lg hover:bg-neutral-800 transition-colors md:hidden"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
};

export default Sidebar;
