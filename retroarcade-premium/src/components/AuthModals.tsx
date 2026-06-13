import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Lock, Mail, User as UserIcon, ShieldAlert } from "lucide-react";

interface AuthModalsProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "register";
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthModals({
  isOpen,
  onClose,
  initialMode,
  onAuthSuccess,
}: AuthModalsProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switch form cleanups
  const handleToggleMode = () => {
    setError(null);
    setMode(mode === "login" ? "register" : "login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload = mode === "login" ? { email, password } : { name, email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Algo deu errado na autenticação. Tente novamente.");
        setLoading(false);
        return;
      }

      // Success callback
      onAuthSuccess(data.user, data.token);
      onClose();

      // Reset fields
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar com o servidor central xdogcassino.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-800 bg-[#121418] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] focus:outline-none"
        >
          {/* Header design bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff41] via-[#00ff41] to-[#ff3131]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="mb-6 mt-2 text-center select-none">
            <h2 className="text-2xl font-black italic tracking-tight text-white uppercase sm:text-3xl">
              {mode === "login" ? (
                <>
                  <span className="text-[#00ff41]">ACESSO</span> RESTRITO
                </>
              ) : (
                <>
                  <span className="text-[#00ff41]">NOVO</span> CADASTRO
                </>
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              {mode === "login"
                ? "Para continuar jogando e salvando seu progresso, realize o login em sua conta xdogcassino."
                : "Crie sua conta agora mesmo para garantir R$ 1.000,00 de saldo de testes fictício!"}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/30 bg-[#ff3131]/10 p-3 text-xs text-red-400"
            >
              <ShieldAlert className="shrink-0 text-[#ff3131]" size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-gray-500 ml-1">
                  Seu Nome / Apelido
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <UserIcon size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Jogador1"
                    className="w-full bg-[#0b0c0e] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-650 focus:border-[#00ff41] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black text-gray-500 ml-1">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: usuario@xdogcassino.com"
                  className="w-full bg-[#0b0c0e] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-650 focus:border-[#00ff41] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-black text-gray-500 ml-1">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Lock size={14} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0c0e] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-650 focus:border-[#00ff41] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="text-left bg-zinc-900/40 p-2 rounded border border-gray-800/60 font-mono text-[9px] text-gray-500">
                Atalho de testes: <span className="text-gray-300">demo@xdogcassino.com</span> / <span className="text-gray-300">password123</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff41] text-black font-black uppercase py-3 rounded-lg mt-4 hover:bg-[#00e039] transition-colors cursor-pointer text-xs tracking-wider"
            >
              {loading ? "PROCESSANDO..." : mode === "login" ? "ENTRAR NA PLATAFORMA" : "ATIVAR PORTAL PREMIUM"}
            </button>
          </form>

          <div className="flex justify-between items-center text-xs text-gray-500 mt-6 select-none border-t border-gray-800 pt-4">
            <span>
              {mode === "login" ? "Não tem uma conta?" : "Já possui portal?"}{" "}
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-[#ff3131] font-bold hover:underline transition-colors focus:outline-none cursor-pointer"
              >
                {mode === "login" ? "Cadastre-se" : "Conectar"}
              </button>
            </span>
            <button
              type="button"
              onClick={() => setError("Portal de autossuporte disponível! Use a senha demonstrativa.")}
              className="hover:text-white transition-colors focus:outline-none cursor-pointer text-[11px]"
            >
              Ajuda?
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
