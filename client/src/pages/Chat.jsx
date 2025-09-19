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

  // Helper to format bot replies
  const formatBotMessage = (text) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          if (/^\d+[\.\)]/.test(line.trim())) {
            // Numbered points
            return (
              <p key={i} className="ml-4 text-gray-300">
                {line.trim()}
              </p>
            );
          } else if (/^[-•*]/.test(line.trim())) {
            // Bullet points
            return (
              <p
                key={i}
                className="ml-4 before:content-['•'] before:mr-2 text-gray-300"
              >
                {line.replace(/^[-•*]\s*/, "").trim()}
              </p>
            );
          } else {
            // Normal text
            return (
              <p key={i} className="text-gray-200 font-medium">
                {line.trim()}
              </p>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="w-dvw h-dvh bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white flex justify-center items-center">
      <div className="flex flex-col justify-between h-full w-full md:w-10/12 lg:w-1/2 p-4">
        {/* Title */}
        <h1 className="text-center text-3xl font-extrabold tracking-wide text-blue-400 drop-shadow-lg">
          Disha Genesis
        </h1>

        {/* Chat Window */}
        <div
          ref={messagesContainerRef}
          className="w-full flex flex-col gap-4 overflow-y-auto [scrollbar-width:none] scroll-smooth [&::-webkit-scrollbar]:hidden flex-1 py-6 px-2"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`text-sm md:text-base leading-relaxed max-w-[85%] md:max-w-[75%] break-words ${
                msg.sender === "user"
                  ? "ml-auto py-3 px-5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl rounded-tr-none shadow-md"
                  : "mr-auto bg-transparent px-2"
              }`}
            >
              {msg.sender === "bot" ? formatBotMessage(msg.text) : msg.text}
            </div>
          ))}

          {generating && (
            <div className="mr-auto text-blue-300 italic font-medium py-2 px-4 bg-transparent flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="flex flex-row items-end bg-neutral-900 rounded-3xl overflow-hidden p-2 shadow-lg border border-neutral-700">
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
            className="px-4 py-3 resize-none flex-1 outline-0 bg-transparent text-white placeholder-gray-400 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            rows={1}
            placeholder="Type your message..."
            style={{ maxHeight: "150px" }}
          ></textarea>

          <button
            onClick={handleSubmit}
            disabled={generating}
            className="flex flex-shrink-0 items-center justify-center cursor-pointer bg-blue-600 hover:bg-blue-500 transition shadow-md rounded-full p-3 ml-2"
          >
            {generating ? (
              <CircleStop size={18} />
            ) : (
              <Send size={18} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
