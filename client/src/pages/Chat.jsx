import { CircleStop, Send } from "lucide-react";
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
      const botMessage = { sender: "bot", text: res.data.response };
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
    <div className="w-dvw h-dvh bg-neutral-900 text-white flex justify-center items-center">
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
              className={`py-2 px-4 rounded-2xl max-w-[90%] ${
                msg.sender === "user"
                  ? "ml-auto bg-neutral-800 rounded-tr-none"
                  : "mr-auto  rounded-tl-none"
              }`}
            >
              {msg.text}
            </p>
          ))}

          {generating && (
            <p className="mr-auto text-blue-600 font-bold py-2 px-4 rounded-2xl rounded-tl-none max-w-[70%] animate-pulse">
              Thinking...
            </p>
          )}
        </div>

        {/* Input Box */}
        <div className="flex flex-row bg-neutral-800 rounded-4xl overflow-hidden p-2 h-18 shadow-2xl shadow-neutral-950 border border-neutral-800/80">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (generating) return;
                handleSubmit();
              }
            }}
            className="px-4 py-3 resize-none row-end-1 rounded-4xl flex-1 outline-0 bg-neutral-800 text-white"
            rows={1}
            placeholder="Type here..."
          ></textarea>

          <button
            onClick={handleSubmit}
            disabled={generating}
            className="flex my-auto cursor-pointer bg-neutral-700 hover:bg-neutral-600 transition rounded-full p-3"
          >
            {generating ? <CircleStop size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
