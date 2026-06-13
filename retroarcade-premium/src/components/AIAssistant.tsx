import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, Loader2, Minimize2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  user: any;
  onBalanceUpdated: () => void;
}

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default function AIAssistant({ user, onBalanceUpdated }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: `Olá! Sou **Max Retro**, seu Mordomo IA do Arcade. 👾\n\nComo posso te ajudar hoje? Posso sugerir jogos para o seu perfil, dar dicas estratégicas ou guiar você com seu saldo de créditos!`,
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || loading) return;

    // Append user message
    const newMsg: ChatMessage = { role: "user", text: textToSend };
    setMessages((prev) => [...prev, newMsg]);
    setInputMsg("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages, // Send history context
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "Max Retro: Hum, parece que meu modem dial-up de 56kbps caiu. Tente novamente!" },
        ]);
        return;
      }

      setMessages((prev) => [...prev, { role: "model", text: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "Erro ao conectar com o serviço de IA." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(undefined, q);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "model",
        text: `Chat reiniciado! Max Retro pronto para mais aventuras. Me pergunte sobre dicas de jogo ou códigos secretos de bônus!`,
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      
      {/* Floating Launcher Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#00ff41] to-[#00e039] text-black shadow-[0_4px_25px_rgba(0,255,65,0.3)] border-2 border-[#00ff41]/60 group relative cursor-pointer"
        >
          <Bot size={26} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border border-black animate-ping" />
        </motion.button>
      )}

      {/* Floating Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            className="w-full max-w-sm sm:w-[360px] h-[500px] rounded-xl border border-gray-800 bg-[#121418] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            {/* Header toolbar */}
            <div className="bg-[#0b0c0e] px-4 py-3 flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-[#1c1f26] border border-gray-800 flex items-center justify-center text-[#00ff41]">
                  <Bot size={18} />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black italic uppercase text-white leading-none">
                    Max Retro IA
                  </h3>
                  <span className="text-[9px] text-[#00ff41] font-mono uppercase tracking-widest block mt-0.5 animate-pulse font-bold">
                    ● MORDOMO DO ARCADE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset button */}
                <button
                  onClick={clearChat}
                  title="Limpar Conversa"
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
                {/* Minimize */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            {/* Chat Messages flow */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg, index) => {
                const isModel = msg.role === "model";
                return (
                  <div key={index} className={`flex ${isModel ? "justify-start" : "justify-end"} items-start gap-2.5`}>
                    {isModel && (
                      <div className="h-6 w-6 rounded bg-[#1c1f26] border border-gray-800/80 flex items-center justify-center text-[#00ff41] shrink-0 text-[10px]">
                        🤖
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs inline-block text-left whitespace-pre-wrap leading-relaxed ${
                      isModel
                        ? "bg-[#1c1f26] border border-gray-800/60 text-zinc-300"
                        : "bg-[#00ff41] text-[#060709] font-black"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start items-center gap-2.5">
                  <div className="h-6 w-6 rounded bg-[#1c1f26] border border-gray-800/80 flex items-center justify-center text-[#00ff41] shrink-0 text-[10px]">
                    🤖
                  </div>
                  <div className="bg-[#1c1f26] border border-gray-800/80 rounded-xl px-4 py-2 text-xs text-zinc-400 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-[#00ff41]" />
                    <span>Processando resposta retro...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions recommendations */}
            <div className="px-4 py-1.5 bg-[#0b0c0e] border-t border-gray-800 overflow-x-auto flex gap-1.5 scrollbar-none whitespace-nowrap">
              {[
                "Dicas Retro Asteroids?",
                "Como funciona o saldo?",
                "Quem é Estúdio PG?",
                "Código secreto de bônus?"
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-2.5 py-1 text-[9px] font-mono bg-zinc-900 hover:bg-[#1c1f26] border border-gray-800/50 rounded text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message input controls */}
            <form onSubmit={(e) => handleSendMessage(e)} className="p-3 border-t border-gray-800 bg-[#0b0c0e] flex gap-2">
              <input
                type="text"
                placeholder="Pergunte ao mordomo Max..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-1 bg-[#121418] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#00ff41]"
              />
              <button
                type="submit"
                disabled={loading || !inputMsg.trim()}
                className="h-8 w-8 flex items-center justify-center rounded bg-[#00ff41] hover:bg-[#00e039] text-black disabled:opacity-50 transition cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
