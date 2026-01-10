import { GithubIcon, LogIn } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="bg-neutral-900 h-dvh text-white">
      {/* navbar */}
      
      <nav className="">
        <div className="w-[70%] py-4 flex flex-row justify-between m-auto">
          <div>
            <p className="text-2xl">Disha Genesis</p>
          </div>
          <div className="flex flex-row gap-4 items-center">
            <GithubIcon className="cursor-pointer" />
            <button className="flex flex-row gap-2 items-center border border-white/50 px-4 p-2 cursor-pointer rounded">
              Try it <LogIn className="size-5" />{" "}
            </button>
          </div>
        </div>
      </nav>

      {/* hero section and other sections starts from here */}
      <main>
        <section className="w-[70%] m-auto mt-40  text-center">
          <h2 className="md:text-6xl font-bold">
            AI-Powered Career Counsellor
          </h2>
          <p className="mt-4 text-xl">
            Talk to our ai counsellor and get clearity about career with reality
            check.
          </p>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
