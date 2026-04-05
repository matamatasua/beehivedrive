"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { ACRONYMS } from "@/lib/acronyms";
import { Button } from "./Button";

interface BeeBrainProps {
  acronym: string;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_MESSAGES = 10; // 5 user + 5 assistant

export function BeeBrain({ acronym, onClose }: BeeBrainProps) {
  const def = ACRONYMS[acronym];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // Fetch initial explanation on mount
  useEffect(() => {
    if (!def) return;

    async function fetchInitial() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ai/bee-brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            acronym: def.short,
            acronymFull: def.full,
            acronymBrief: def.brief,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to get explanation");
        }

        const data = await res.json();
        setMessages([{ role: "assistant", content: data.response }]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInitial();
  }, [def]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !def) return;
    if (messages.length >= MAX_MESSAGES) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/bee-brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acronym: def.short,
          acronymFull: def.full,
          acronymBrief: def.brief,
          message: text,
          history: updatedMessages,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to get response");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canSendMore = messages.length < MAX_MESSAGES;

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!def) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal — slides up on mobile, centered on desktop */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 sm:static sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:max-w-md sm:w-full"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐝🎓</span>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">
                    Bee Brain
                  </h2>
                  <p className="text-xs text-gray-500">Your study buddy</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Acronym badge */}
            <div className="px-4 pt-3 pb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                {def.short}: {def.full}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-amber-50 text-gray-800 border border-amber-100"
                        : "bg-blue-50 text-gray-800 border border-blue-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center text-sm text-red-500 py-2">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100">
              {canSendMore ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Ask me anything about ${def.short}...`}
                    disabled={loading}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="!p-2 !rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400">
                  Conversation limit reached. Close and reopen to start fresh.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
