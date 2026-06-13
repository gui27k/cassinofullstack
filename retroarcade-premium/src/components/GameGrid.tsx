import React from "react";
import { Play, Flame, Star, Zap, ShieldCheck } from "lucide-react";
import { Game } from "../types";

interface GameGridProps {
  games: Game[];
  searchQuery: string;
  activeCategory: string;
  onPlaySelect: (game: Game) => void;
}

export default function GameGrid({
  games,
  searchQuery,
  activeCategory,
  onPlaySelect,
}: GameGridProps) {
  
  // Filter games based on search text and category selection
  const filteredGames = games.filter((game) => {
    // Search match
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category match
    if (activeCategory === "Lobby") return matchesSearch;
    if (activeCategory === "Lançamentos") {
      return matchesSearch && (game.id === "mines" || game.id === "crash" || game.id === "ox");
    }
    if (activeCategory === "Populares") {
      return matchesSearch && (game.id === "blackjack" || game.id === "slots" || game.id === "ox");
    }
    return matchesSearch;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Title with decorative lines aligned with High Density spec */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-gray-800 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black uppercase italic border-l-4 border-[#00ff41] pl-3 text-white leading-none">
              Mesa de Operações
            </h2>
          </div>
          <p className="mt-1.5 text-gray-400 text-xs sm:text-sm">
            Selecione uma mesa exclusiva na plataforma <span className="text-white font-bold">xdogcassino</span>. Sem taxas de admissão, seu saldo é colocado em jogo apenas na rodada!
          </p>
        </div>
        
        <span className="mt-2 sm:mt-0 font-mono text-[10px] uppercase text-gray-500 tracking-wider">
          Filtrando por: {activeCategory} • {filteredGames.length} títulos ativos
        </span>
      </div>

      {filteredGames.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-[#121418] p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#1c1f26] border border-gray-800 text-[#00ff41] mb-4">
            <Star size={24} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase font-mono">Nenhuma mesa encontrada</h3>
          <p className="text-gray-400 text-xs mt-1 max-w-md mx-auto">
            Não conseguimos localizar operadoras correspondentes a busca "{searchQuery}". Tente buscar por "Mines", "Crash", "Slots" ou "Blackjack".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            // Pick static beautiful gradient patterns based on game id
            let cardGradient = "from-emerald-500/10 to-indigo-600/10";
            let visualIcon = <Zap size={22} className="text-[#00ff41]" />;
            
            if (game.id === "blackjack") {
              cardGradient = "from-emerald-950/40 via-zinc-900/80 to-indigo-950/40";
              visualIcon = <span className="text-xl select-none">🃏</span>;
            } else if (game.id === "mines") {
              cardGradient = "from-amber-950/40 via-zinc-900/80 to-red-950/40";
              visualIcon = <span className="text-xl select-none">💣</span>;
            } else if (game.id === "slots") {
              cardGradient = "from-yellow-950/40 via-zinc-900/80 to-orange-950/40";
              visualIcon = <span className="text-xl select-none">🎰</span>;
            } else if (game.id === "ox") {
              cardGradient = "from-orange-950/40 via-zinc-900/80 to-red-950/40";
              visualIcon = <span className="text-xl select-none">🐂</span>;
            } else if (game.id === "crash") {
              cardGradient = "from-purple-950/40 via-zinc-900/80 to-rose-950/40";
              visualIcon = <span className="text-xl select-none">📈</span>;
            }

            return (
              <div
                key={game.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#121418] transition-all hover:scale-[1.02] hover:border-[#00ff41]/40 hover:shadow-[0_0_25px_rgba(0,255,65,0.07)]"
              >
                {/* Yellow TOP badge on top left */}
                <div className="absolute top-2.5 left-2.5 z-10 bg-[#00ff41] text-black text-[10px] font-black px-2.5 py-0.5 rounded shadow select-none uppercase tracking-wider">
                  SALA PREMIUM
                </div>

                {/* Difficulty / Tag on top right */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="rounded border border-gray-800 bg-black/75 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-gray-300 select-none font-bold">
                    {game.difficulty}
                  </span>
                </div>

                {/* Game cover rendered as absolute background cover with high density gradient */}
                <div className="relative h-44 w-full overflow-hidden border-b border-gray-800/80">
                  <img
                    src={game.imagePath}
                    alt={game.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:blur-[1px]"
                  />
                  {/* Dense overlay gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121418] via-zinc-950/30 to-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient} mix-blend-color opacity-60`} />
                  
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px]" />
                  
                  {/* Small clean symbol badge in bottom left */}
                  <div className="absolute bottom-3 left-4 transform transition-transform duration-300 z-10 select-none">
                    <div className="p-2 backdrop-blur-md bg-black/70 rounded-full border border-gray-700/50 flex items-center justify-center h-10 w-10">
                      {visualIcon}
                    </div>
                  </div>

                  {/* Play Game Button Overlay on hover */}
                  <div className="absolute inset-0 bg-black/75 hidden group-hover:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button
                      onClick={() => onPlaySelect(game)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#00ff41] hover:bg-[#00e039] text-black font-black text-xs uppercase tracking-wider rounded transition-transform transform active:scale-95 cursor-pointer animate-fade-in"
                    >
                      <Play className="fill-current" size={12} />
                      Jogar Agora (Grátis)
                    </button>
                  </div>
                </div>

                {/* Game Title Info */}
                <div className="flex-1 p-4 text-left flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black italic uppercase text-white tracking-tight leading-tight group-hover:text-[#00ff41] transition-colors">
                      {game.title}
                    </h3>
                    
                    {/* Estilo PG / Dev Name */}
                    <p className="mt-0.5 text-xs text-gray-500">
                      by <span className="text-gray-400 font-bold">{game.developer}</span>
                    </p>
                    
                    <p className="mt-2 text-xs text-gray-400 leading-snug line-clamp-2">
                      {game.description}
                    </p>
                  </div>

                  {/* Tags and Play statistic */}
                  <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center">
                    <div className="flex gap-1.5">
                      {game.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-gray-400 bg-[#1c1f26] border border-gray-800 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <span className="text-[9px] font-mono text-[#00ff41] font-bold">
                      ★ MULTI-REWARDS ATIVOS
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
