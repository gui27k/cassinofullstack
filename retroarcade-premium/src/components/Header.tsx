import React, { useState } from "react";
import { Search, Gamepad2, Coins, LogOut, Gift, User, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  user: any;
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onClaimDaily: () => void;
  onAddCredits: (amount: number) => void;
}

export default function Header({
  user,
  onLoginClick,
  onRegisterClick,
  onLogout,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  onClaimDaily,
  onAddCredits,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#121418] z-20 shrink-0">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left side: Logo */}
        <div className="flex items-center gap-6 cursor-pointer" onClick={() => onCategoryChange("Lobby")}>
          <div className="text-2xl font-black italic tracking-tighter text-white select-none">
            <span className="text-[#00ff41]">XDOG</span>CASSINO<span className="text-[#00ff41]">.</span>
          </div>
          
          {/* Navigation terms */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {["Lobby", "Lançamentos", "Populares"].map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`transition-colors font-bold ${
                  activeCategory === cat
                    ? "text-white border-b-2 border-[#00ff41] pb-1"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Search & Categories */}
        <div className="flex flex-1 max-w-sm mx-4 md:mx-6 items-center">
          {/* Search Input */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Search size={14} className="text-gray-500" />
            </span>
            <input
              type="text"
              placeholder="Buscar jogos instantâneos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#1c1f26] border border-gray-700/80 rounded-full py-1.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-505 focus:outline-none focus:border-[#00ff41] transition-colors"
            />
          </div>
        </div>

        {/* Right side: Categories & Profile */}
        <div className="flex items-center gap-4">

          {/* User Section */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Credits Pill */}
                <div className="flex flex-col items-end mr-1 select-none">
                  <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider text-[#00ff41]">SAQUE / SALDO</span>
                  <span className="text-white font-mono text-sm font-black flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-gray-800">
                    R$ {user.credits.toLocaleString("pt-BR")},00
                  </span>
                </div>

                {/* Avatar area dropdown trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#00ff41] to-[#ff3131] border-2 border-gray-800 shadow-md flex items-center justify-center font-bold text-white text-xs overflow-hidden leading-none shrink-0">
                    <span className="drop-shadow-md">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="text-xs font-bold text-white group-hover:text-[#00ff41] transition-colors max-w-[80px] truncate">{user.name}</p>
                    <span className="text-[10px] text-gray-500 font-mono">Pro Member</span>
                  </div>
                  <ChevronDown className={`text-zinc-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} size={12} />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-800 bg-[#121418] p-2 shadow-2xl z-20"
                      >
                        <div className="px-3 py-2 border-b border-gray-800/80 text-left mb-1">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Conta Conectada</p>
                          <p className="text-xs font-mono text-zinc-300 truncate mt-0.5">{user.email}</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            onClaimDaily();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#00ff41] hover:bg-emerald-950/20 text-left transition-colors"
                        >
                          <Gift size={14} />
                          <span>Resgatar Diário grátis (+R$ 500,00)</span>
                        </button>

                        <button
                          onClick={() => {
                            onAddCredits(500);
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 text-left transition-colors"
                        >
                          <Plus size={14} className="text-[#00ff41]" />
                          <span>Simular Recarga (+R$ 500,00)</span>
                        </button>

                        <div className="h-px bg-gray-800 my-1" />

                        <button
                          onClick={() => {
                            onLogout();
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#ff3131] hover:bg-red-950/25 text-left transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Encerrar Sessão</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLoginClick}
                  className="hidden sm:inline-block px-4 py-2 border border-gray-800 hover:border-gray-700 bg-[#1c1f26] text-xs font-semibold text-white rounded-lg transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={onRegisterClick}
                  className="px-4 py-2 bg-[#00ff41] hover:bg-[#00e039] text-xs font-bold text-black rounded-lg shadow-[0_0_15px_rgba(0,255,65,0.15)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Sub menu categories for mobile view */}
      <div className="lg:hidden border-t border-gray-800 bg-[#0b0c0e] py-1.5 px-4 flex justify-center gap-3">
        {["Lobby", "Lançamentos", "Populares"].map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`text-xs px-3.5 py-1 rounded-lg font-bold transition-colors ${
              activeCategory === cat
                ? "bg-[#1c1f26] text-[#00ff41]"
                : "text-gray-500 hover:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </header>
  );
}
