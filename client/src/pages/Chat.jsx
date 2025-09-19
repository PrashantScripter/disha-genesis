import { CircleStop, Send, Loader2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
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

  // Custom components for markdown rendering
  const markdownComponents = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold text-blue-100 mb-4 mt-6 first:mt-0 border-b border-blue-300/30 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold text-blue-200 mb-3 mt-5 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-blue-300 mb-3 mt-4 first:mt-0">
        {children}
      </h3>
    ),

    p: ({ children }) => (
      <p className="text-gray-100 mb-3 leading-relaxed">{children}</p>
    ),

    ul: ({ children }) => (
      <ul className="list-none space-y-2 mb-4 ml-2">{children}</ul>
    ),

    li: ({ children, ...props }) => {
      const isOrdered = props.node?.parent?.tagName === "ol";
      return (
        <li
          className={`flex items-start gap-3 text-gray-100 ${
            isOrdered ? "" : ""
          }`}
        >
          {!isOrdered && (
            <span className="text-blue-400 font-bold text-lg mt-0.5 flex-shrink-0">
              •
            </span>
          )}
          <span className="leading-relaxed">{children}</span>
        </li>
      );
    },

    ol: ({ children }) => (
      <ol className="list-decimal list-inside space-y-2 mb-4 ml-2 marker:text-blue-400 marker:font-semibold">
        {children}
      </ol>
    ),

    strong: ({ children }) => (
      <strong className="font-bold text-yellow-200">{children}</strong>
    ),

    em: ({ children }) => <em className="italic text-blue-200">{children}</em>,

    hr: () => (
      <hr className="border-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent my-6" />
    ),

    code: ({ inline, children, ...props }) => {
      if (inline) {
        return (
          <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return (
        <pre className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4 overflow-x-auto">
          <code className="text-green-300 font-mono text-sm" {...props}>
            {children}
          </code>
        </pre>
      );
    },

    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 bg-blue-900/20 pl-4 py-2 mb-4 italic text-blue-100">
        {children}
      </blockquote>
    ),

    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
      >
        {children}
      </a>
    ),

    table: ({ children }) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border border-gray-600 rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-blue-900/50 border border-gray-600 px-4 py-2 text-left font-semibold text-blue-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-gray-600 px-4 py-2 text-gray-100">
        {children}
      </td>
    ),
  };

  return (
    <div className="w-dvw h-dvh bg-neutral-900 text-white flex justify-center items-center">
      <div className="flex flex-col justify-between h-full w-full md:w-10/12 lg:w-2/3 xl:w-1/2 p-4">
        <h1 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Disha Genesis
        </h1>

        <div
          ref={messagesContainerRef}
          className="w-full flex flex-col gap-4 overflow-y-auto [scrollbar-width:thin] scroll-smooth scrollbar-track-transparent flex-1 py-4"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-2xl p-4 ${
                  msg.sender === "user"
                    ? "bg-neutral-800 text-white rounded-tr-sm max-w-[60%]"
                    : "bg-transparent w-full"
                }`}
              >
                {msg.sender === "user" ? (
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </p>
                ) : (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {generating && (
            <div className="flex justify-start">
              <div className="bg-transparent font-medium py-3 px-4 rounded-2xl rounded-tl-md max-w-[70%] flex items-center gap-3">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row items-end bg-neutral-800 rounded-2xl overflow-hidden p-2 shadow-2xl shadow-black ">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 150) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (generating) return;
                handleSubmit();
              }
            }}
            className="px-4 py-3 resize-none rounded-xl flex-1 outline-0 bg-transparent text-white overflow-y-auto [scrollbar-width:thin] scrollbar-track-transparent scrollbar-thumb-gray-600 placeholder-gray-400"
            rows={1}
            placeholder="Type here..."
            style={{ maxHeight: "150px" }}
          />

          <button
            onClick={handleSubmit}
            disabled={generating}
            className="flex flex-shrink-0 items-center justify-center cursor-pointer bg-neutral-700 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors rounded-full p-3 ml-3 shadow-lg"
          >
            {generating ? (
              <CircleStop size={20} className="text-white" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
