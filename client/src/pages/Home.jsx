import React from "react";
// import Sidebar from "../components/ui/Sidebar";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Waypoints } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-900 min-h-screen w-full flex flex-row text-white overflow-hidden">
      {/* <Sidebar /> */}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Header Section - Optional */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Welcome to Disha Genesis
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base">
              Discover your perfect career path with AI-powered guidance
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {/* Career Guidance Card */}
            <div
              onClick={() => navigate("/chat")}
              className="flex flex-col bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group overflow-hidden"
            >
              {/* Card Image */}
              <div className="w-full h-48 sm:h-52 lg:h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
                <Waypoints size={48} className="text-green-300" />
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                  Find your perfect career
                </h3>
                <p className="text-sm sm:text-base text-neutral-300 flex-1">
                  Talk to our AI career counsellor and get personalized guidance
                  for your future.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-700">
                  <span className="text-xs sm:text-sm text-blue-400 font-medium">
                    Start your journey →
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Cards - You can add more cards here */}
            {/* <div className="flex flex-col bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-700 hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 group overflow-hidden">
              <div className="w-full h-48 sm:h-52 lg:h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center">
                <Waypoints size={48} className="text-green-300" />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                  Career Assessment
                </h3>
                <p className="text-sm sm:text-base text-neutral-300 flex-1">
                  Take our comprehensive assessment to discover careers that
                  match your interests and skills.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-700">
                  <span className="text-xs sm:text-sm text-green-400 font-medium">
                    Take assessment →
                  </span>
                </div>
              </div>
            </div> */}

            {/* <div className="flex flex-col bg-neutral-800 rounded-2xl cursor-pointer border border-neutral-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 group overflow-hidden">
              <div className="w-full h-48 sm:h-52 lg:h-48 overflow-hidden rounded-t-2xl bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center">
                <TrendingUp size={48} className="text-purple-300" />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-purple-400 transition-colors">
                  Trending Careers
                </h3>
                <p className="text-sm sm:text-base text-neutral-300 flex-1">
                  Explore the most in-demand careers and emerging opportunities
                  in the job market.
                </p>
                <div className="mt-4 pt-3 border-t border-neutral-700">
                  <span className="text-xs sm:text-sm text-purple-400 font-medium">
                    View trends →
                  </span>
                </div>
              </div>
            </div> */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
