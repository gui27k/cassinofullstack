import React from "react";
import { Play, Sparkles, Trophy, SwatchBook, Zap } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onCtaClick: () => void;
  user: any;
}

export default function Hero({ onCtaClick, user }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0b0c0e] py-8 border-b border-gray-900">
      
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent z-10" />
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-[#00ff4122] to-transparent pointer-events-none opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Banner Container Card */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#121418] p-6 sm:p-10 lg:p-12 shadow-2xl">
          
          {/* Top small badge */}
          <div className="flex items-center gap-1.5 w-fit rounded bg-emerald-950/40 border border-[#00ff41]/50 px-2.5 py-1 font-mono text-[10px] uppercase text-[#00ff41] mb-6 select-none font-bold tracking-wider">
            <Sparkles size={11} className="text-[#00ff41]" />
            <span>MESA DE CASINO CASUAL PREMIUM LIVE • DISPONÍVEL AGORA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-8 text-left z-10">
              <span className="text-[#00ff41] font-black uppercase tracking-[0.2em] text-xs mb-2 block animate-pulse">
                ★ DESTAQUE DA SEMANA CONTRA O DEALER ★
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black italic uppercase leading-none mb-4 tracking-tighter">
                ROYAL <span className="text-[#00ff41]">BLACKJACK</span> <br />
                <span className="text-white">PREMIUM EDITION</span>
              </h1>
              
              <p className="mt-4 text-sm text-gray-300 max-w-2xl leading-relaxed">
                Desafie a banca na nossa nova inteligência de cartas da <span className="text-white font-bold">Pragmatic Play</span>. Jogo intuitivo com regras realistas de <span className="text-[#00ff41] font-bold">Blackjack</span>, multiplicadores de aposta e placar de pontuação dinâmica. 
                Crie sua conta agora e comece imediatamente com <span className="text-[#00ff41] font-mono font-bold">R$ 1.000,00 de saldo</span> para jogar e ganhar!
              </p>

              {/* Fictional promotion statistics info */}
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg border-t border-gray-800 pt-6">
                <div>
                  <span className="block text-xl font-black text-white tracking-tight">SALDO INICIAL</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">R$ 1.000,00 Iniciais</span>
                </div>
                <div>
                  <span className="block text-xl font-black text-[#00ff41] tracking-tight">4+ JOGOS CASINO</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mines, Crash, Slots & Blackjack</span>
                </div>
                <div>
                  <span className="block text-xl font-black text-[#ff3131] tracking-tight">MÍNIMO</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Só R$ 10,00 por aposta</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <button
                  onClick={onCtaClick}
                  className="bg-[#00ff41] text-black px-8 py-3 rounded font-black uppercase italic tracking-wider hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,255,65,0.25)] flex items-center gap-2"
                >
                  <Play size={14} className="fill-current text-black" />
                  <span>{user ? "Acessar Mesa Blackjack" : "Cadastrar e Jogar Blackjack"}</span>
                </button>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono font-bold">
                  <Zap size={14} className="text-[#00ff41]" />
                  <span>Apostas a partir de <span className="text-white font-bold">R$ 10,00</span></span>
                </div>
              </div>

            </div>

            {/* Right Column Visual Mockup */}
            <div className="lg:col-span-4 relative flex justify-center lg:justify-end">
              <div className="relative group w-full max-w-[280px]">
                {/* Neon box glow */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00ff41] to-[#ff3131] opacity-20 blur-xl group-hover:opacity-35 transition duration-500" />
                
                {/* Visual card */}
                <div className="relative rounded-xl border border-gray-800 bg-[#121418] p-4 text-left overflow-hidden">
                  <div className="h-44 w-full bg-[#0c0d11] border border-gray-800 rounded relative overflow-hidden flex flex-col items-center justify-center py-4">
                    <div className="absolute top-2 left-2 bg-[#ff3131] text-white text-[9px] font-black px-2 py-0.5 rounded z-10 uppercase tracking-widest animate-pulse">
                      DESTAQUE 21
                    </div>
                    
                    {/* Visual cards design */}
                    <div className="flex gap-1.5 mt-2 justify-center">
                      <div className="w-14 h-20 bg-white text-black border border-gray-300 rounded shadow-md flex flex-col justify-between p-1.5 select-none rotate-[-6deg] translate-x-2">
                        <span className="font-bold text-xs text-red-600 font-mono">A♦</span>
                        <span className="text-center font-bold text-lg text-red-600">♦</span>
                        <span className="font-bold text-xs text-red-600 font-mono text-right transform rotate-180">A♦</span>
                      </div>
                      <div className="w-14 h-20 bg-white text-black border border-gray-300 rounded shadow-lg flex flex-col justify-between p-1.5 select-none rotate-[6deg] translate-x-[-8px] z-10">
                        <span className="font-bold text-xs font-mono text-zinc-900">J♠</span>
                        <span className="text-center font-bold text-[18px] text-zinc-900">♠</span>
                        <span className="font-bold text-xs font-mono text-zinc-900 text-right transform rotate-180">J♠</span>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1 bg-black/90 w-full text-center py-1 select-none">
                      <span className="font-mono text-[9px] text-[#00ff41] uppercase tracking-widest font-extrabold block">BLACKJACK DESTAQUE</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">CASINO PREMIUM</span>
                    <h3 className="text-sm font-black text-white italic tracking-tight uppercase mt-0.5">BATA A BANCA DO CYBER DEALER</h3>
                    <p className="text-gray-400 text-xs mt-1 leading-snug">Calcule seus acertos, peça carta ou pare, e sinta o gosto do Blackjack na modalidade casual.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
