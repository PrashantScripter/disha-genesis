import React from "react";

const LandingPage = () => {
  return (
    <div className="font-sans bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 bg-blue-900 text-white sticky top-0 z-50">
        <h2 className="font-bold text-lg">Disha Genesis</h2>
        <div className="flex gap-4 items-center">
          <a href="#home" className="hover:underline">
            Home
          </a>
          <a href="#why" className="hover:underline">
            Why Us
          </a>
          <a href="#how" className="hover:underline">
            How It Works
          </a>
          <a href="#trends" className="hover:underline">
            Job Trends
          </a>
          <a href="#contact" className="hover:underline">
            Contact
          </a>
          <button className="bg-yellow-400 text-black px-4 py-2 rounded-md hover:bg-yellow-500">
            Start My Journey 🚀
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="text-center py-16 bg-sky-100">
        <h1 className="text-3xl md:text-4xl font-bold">
          Discover Your Perfect Career Path
        </h1>
        <p className="mt-4 text-gray-600 max-w-xl mx-auto">
          Personalized AI-powered guidance to help Indian students find careers
          they love and succeed in.
        </p>
        <button className="mt-6 bg-blue-900 text-white px-6 py-3 rounded-md hover:bg-blue-800">
          Chat With Career Buddy 💬
        </button>
      </header>

      {/* Two Panels Section */}
      <section className="flex flex-wrap justify-center gap-8 py-12 px-6">
        <div className="bg-white p-8 rounded-xl shadow-md text-center w-72">
          <h2 className="text-xl font-semibold">🎯 I Know My Interests</h2>
          <p className="mt-2 text-gray-600">
            Already clear about your goals? Let us map your skills to the right
            career path.
          </p>
          <button className="mt-4 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800">
            Get My Roadmap
          </button>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md text-center w-72">
          <h2 className="text-xl font-semibold">🔍 I Am Unsure</h2>
          <p className="mt-2 text-gray-600">
            Not sure yet? Answer fun, interactive questions and discover careers
            that truly fit you.
          </p>
          <button className="mt-4 bg-blue-900 text-white px-4 py-2 rounded-md hover:bg-blue-800">
            Discover My Path
          </button>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="why" className="py-12 px-6 text-center bg-white">
        <h2 className="text-2xl font-bold">🌟 Why Choose Disha Genesis?</h2>
        <p className="text-gray-600 mt-2 mb-8">
          We go beyond generic career advice — here’s what makes us unique.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="font-semibold">🎯 Personalized Guidance</h3>
            <p className="mt-2 text-gray-600">
              Tailored career paths based on your unique strengths.
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="font-semibold">🤖 AI + Human Touch</h3>
            <p className="mt-2 text-gray-600">
              Smart chatbot + interactive web dashboard for engagement.
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="font-semibold">📊 Real Job Trends</h3>
            <p className="mt-2 text-gray-600">
              Stay updated with in-demand careers and required skills.
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="font-semibold">🌱 Skill Gap Mapping</h3>
            <p className="mt-2 text-gray-600">
              Know exactly what you need to learn to succeed.
            </p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow">
            <h3 className="font-semibold">💡 Interactive & Fun</h3>
            <p className="mt-2 text-gray-600">
              Quizzes, gamified journeys, and simulators make it exciting.
            </p>
          </div>
        </div>
      </section>

      {/* Job Trends Section */}
      <section id="trends" className="py-12 px-6 text-center bg-gray-100">
        <h2 className="text-2xl font-bold">📊 Recent Job Market Trends</h2>
        <p className="text-gray-600 mt-2">
          Stay ahead with live insights into careers in demand.
        </p>
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow w-56">
            <h3 className="font-semibold">Data Scientist</h3>
            <p>💰 Avg Salary: ₹12 LPA</p>
            <p>⚡ Skills: Python, ML, SQL</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow w-56">
            <h3 className="font-semibold">UI/UX Designer</h3>
            <p>💰 Avg Salary: ₹8 LPA</p>
            <p>⚡ Skills: Figma, Creativity</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow w-56">
            <h3 className="font-semibold">Cybersecurity Analyst</h3>
            <p>💰 Avg Salary: ₹10 LPA</p>
            <p>⚡ Skills: Networking, Security Tools</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow w-56">
            <h3 className="font-semibold">AI/ML Engineer</h3>
            <p>💰 Avg Salary: ₹14 LPA</p>
            <p>⚡ Skills: TensorFlow, Deep Learning</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4 mt-6 bg-blue-900 text-white">
        <p>© 2025 Disha Genesis. Empowering Futures.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
