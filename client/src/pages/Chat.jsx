import { CircleStop, Send, Loader2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]); // chat history
  const messagesContainerRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;

    // Add user message to chat
    const newMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, newMessage]);

    try {
      setGenerating(true);
      const userInputCopy = userInput;
      setUserInput("");

      const res = await axios.post(
        "http://localhost:3000/api/chat/getCareerGuidance",
        { userInput: userInputCopy }
      );

      // Add bot message to chat
      const botMessage = { sender: "bot", text: res.data.response.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong." },
      ]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="w-dvw h-dvh bg-gradient-to-br from-[#0a1a3f] via-[#11235a] to-[#1b2e70] text-white flex justify-center items-center">
      <div className="flex flex-col justify-between h-full w-full md:w-10/12 lg:w-1/2 p-4">

        {/* Title */}
        <h1 className="text-center text-2xl font-bold">Disha Genesis</h1>

        {/* Chat Window */}
        <div
          ref={messagesContainerRef}
          className="w-full flex flex-col gap-3 overflow-y-auto [scrollbar-width:none] scroll-smooth [&::-webkit-scrollbar]:hidden flex-1 py-4"
        >
          {messages.map((msg, index) => (
            <p
              key={index}
              className={`py-2 px-4 rounded-2xl max-w-[80%] md:max-w-[70%] break-words overflow-y-auto max-h-60 ${
                msg.sender === "user"
<<<<<<< HEAD
                  ? "ml-auto bg-gradient-to-br from-green-800 to-green-600 text-white rounded-tr-none whitespace-pre-line"
                  : "mr-auto bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 rounded-tl-none whitespace-pre-line"
=======
                  ? "ml-auto bg-neutral-800 rounded-tr-none whitespace-pre-wrap"
                  : "mr-auto  rounded-tl-none whitespace-pre-wrap"
>>>>>>> 30229a5dcce2a8f25d6463df9147db6d712dd444
              }`}
            >
              {msg.text}
            </p>
          ))}

          {generating && (
            <div className="mr-auto text-blue-300 font-bold py-2 px-4 rounded-2xl rounded-tl-none max-w-[70%] flex items-center gap-2 bg-gradient-to-br from-gray-700 to-gray-800">
              <Loader2 className="animate-spin" size={18} />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="flex flex-row items-end bg-neutral-800 rounded-4xl overflow-hidden p-2 shadow-2xl shadow-neutral-950 border border-neutral-800/80">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onInput={(e) => {
              e.target.style.height = "auto"; // reset height
              e.target.style.height =
                Math.min(e.target.scrollHeight, 150) + "px"; // grow until max
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (generating) return;
                handleSubmit();
              }
            }}
            className="px-4 py-3 resize-none rounded-4xl flex-1 outline-0 bg-neutral-800 text-white overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            rows={1}
            placeholder="Type here..."
            style={{ maxHeight: "150px" }}
          ></textarea>

          <button
            onClick={handleSubmit}
            disabled={generating}
            className="flex flex-shrink-0 items-center justify-center cursor-pointer bg-gray-600 hover:bg-blue-500 transition rounded-full p-3 ml-2"
          >
            {generating ? <CircleStop size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
