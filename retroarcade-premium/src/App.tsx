import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Mail, Key, Coins, Gamepad2, Gift, Sparkles, X, ShieldAlert, CheckCircle, Zap } from "lucide-react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import GameGrid from "./components/GameGrid";
import GamePlayer from "./components/GamePlayer";
import AuthModals from "./components/AuthModals";
import AIAssistant from "./components/AIAssistant";
import { Game, User } from "./types";

// Fictional Arcade catalog list
const ARCADE_GAMES: Game[] = [
  {
    id: "slots",
    title: "Fortune Tiger Slots",
    description: "Alinhe os símbolos imperiais de ouro nas bobinas e ative a maravilhosa Carta do Tigrinho com multiplicadores extras de até 10x!",
    developer: "PG Soft",
    imagePath: "/src/assets/images/slots_cover_new_1781359623270.jpg",
    tags: ["Slots", "Tigrinho", "Destaque"],
    premiumCost: 0,
    difficulty: "Fácil",
    playsCount: 38410,
  },
  {
    id: "ox",
    title: "Fortune Ox Slots",
    description: "Gire as bobinas da sorte com o Touro da Fortuna. Multiplicadores de até 10x e recurso Touro de Ouro ativo!",
    developer: "PG Soft",
    imagePath: "/src/assets/images/ox_cover_new_1781359649601.jpg",
    tags: ["Slots", "Touro", "Popular"],
    premiumCost: 0,
    difficulty: "Médio",
    playsCount: 29421,
  },
  {
    id: "mines",
    title: "Mines Strategy",
    description: "Abra os campos de minas com inteligência tática, colete os diamantes cintilantes e decida a hora exata de sacar seus lucros.",
    developer: "PG Soft",
    imagePath: "/src/assets/images/mines_cover_new_1781359599113.jpg",
    tags: ["Mines", "Estratégia", "Popular"],
    premiumCost: 0,
    difficulty: "Fácil",
    playsCount: 14210,
  },
  {
    id: "crash",
    title: "Crash Velocity",
    description: "Acompanhe a subida exponencial do multiplicador em tempo real e retire seus ganhos antes do rocket explodir.",
    developer: "Evolution",
    imagePath: "/src/assets/images/crash_cover_new_1781359610622.jpg",
    tags: ["Crash", "Multiplicador", "Ação"],
    premiumCost: 0,
    difficulty: "Difícil",
    playsCount: 18562,
  },
  {
    id: "blackjack",
    title: "Royal Blackjack",
    description: "Desafie o croupier virtual em tempo real, some 21 pontos ou chegue o mais perto possível sem estourar. Dobre ou pare estrategicamente.",
    developer: "Pragmatic Play",
    imagePath: "/src/assets/images/blackjack_cover_new_1781359636121.jpg",
    tags: ["Cartas", "Estratégia", "Popular"],
    premiumCost: 0,
    difficulty: "Médio",
    playsCount: 22890,
  },
];

interface NotificationToast {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Lobby");
  
  // Auth state
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  // Game state
  const [playingGame, setPlayingGame] = useState<Game | null>(null);

  // Notification toasts list
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Function to spawn dynamic alerts
  const showToast = (type: "success" | "info" | "warning", title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast: NotificationToast = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Check user session status on boot (Persistência de Sessão)
  const fetchSession = async () => {
    try {
      // Look for custom bearer header if cookies are sandboxed in iframe
      const backupToken = localStorage.getItem("arcade_session_token");
      const headers: any = {};
      
      if (backupToken) {
        headers["Authorization"] = `Bearer ${backupToken}`;
      }

      const res = await fetch("/api/usuario/me", { headers });
      const data = await res.json();
      
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("Falha de rede ao requisitar metadados de sessão:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Handle successful login or register
  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    // Persist token in local storage as reliable backup fallback inside Iframe containers
    localStorage.setItem("arcade_session_token", token);
    showToast(
      "success",
      `Bem-vindo, ${userData.name}!`,
      `Seu portal foi conectado com sucesso. Saldo inicial: ${userData.credits} créditos.`
    );
  };

  // Log Out operation
  const handleLogOut = async () => {
    try {
      const backupToken = localStorage.getItem("arcade_session_token");
      const headers: any = {};
      if (backupToken) {
        headers["Authorization"] = `Bearer ${backupToken}`;
      }

      await fetch("/api/auth/logout", {
        method: "POST",
        headers,
      });

      setUser(null);
      localStorage.removeItem("arcade_session_token");
      showToast("info", "Sessão Encerrada", "Você saiu da arena segura xdogcassino.");
    } catch (err) {
      console.error(err);
    }
  };

  // Claim free Daily Rewards credits
  const handleClaimDaily = async () => {
    if (!user) return;

    try {
      const backupToken = localStorage.getItem("arcade_session_token");
      const headers: any = { "Content-Type": "application/json" };
      if (backupToken) {
        headers["Authorization"] = `Bearer ${backupToken}`;
      }

      const response = await fetch("/api/usuario/daily-claim", {
        method: "POST",
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        showToast("warning", "Aviso de Limite", data.error || "Limite atingido.");
        return;
      }

      // Update local state balance
      setUser({ ...user, credits: data.credits });
      showToast("success", "Recompensa Resgatada!", data.message);
    } catch (e) {
      showToast("warning", "Erro", "Impossível processar sua recompensa.");
    }
  };

  // Simulado credit purchase
  const handleAddCredits = async (amount: number) => {
    if (!user) return;

    try {
      const backupToken = localStorage.getItem("arcade_session_token");
      const headers: any = { "Content-Type": "application/json" };
      if (backupToken) {
        headers["Authorization"] = `Bearer ${backupToken}`;
      }

      const response = await fetch("/api/usuario/recarregar", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast("warning", "Erro na recarga", "Não foi possível carregar saldo de testes.");
        return;
      }

      setUser({ ...user, credits: data.credits });
      showToast("success", "Recarga Efetuada!", data.message);
    } catch (e) {
      showToast("warning", "Erro de Conectividade", "Não foi possível simular a recarga.");
    }
  };

  // Trigger game initialization interceptor
  const handlePlaySelect = async (gameToPlay: Game) => {
    // Interceptor: Se deslogado, bloquear e disparar aviso e modal de login
    if (!user) {
      showToast(
        "warning",
        "Acesso Bloqueado",
        "Você precisa estar conectado para jogar! Criar uma conta agora garante R$ 1.000,00 de Saldo grátis."
      );
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }

    try {
      const backupToken = localStorage.getItem("arcade_session_token");
      const headers: any = { "Content-Type": "application/json" };
      if (backupToken) {
        headers["Authorization"] = `Bearer ${backupToken}`;
      }

      const response = await fetch("/api/jogos/jogar", {
        method: "POST",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("warning", "Aviso", data.error || "Seu Saldo é insuficiente para iniciar.");
        return;
      }

      // No deduction when entering!
      setUser((prev) => prev ? { ...prev, credits: data.credits } : null);
      showToast("success", "Mesa Liberada", `Bem-vindo à mesa de ${gameToPlay.title}! Saldo carregado, boa sorte!`);
      
      // Initialize fullscreen player
      setPlayingGame(gameToPlay);
    } catch (err) {
      console.error(err);
      showToast("warning", "Problema com a Conexão", "Não foi possível autorizar o início do jogo.");
    }
  };

  // Trigger callback when points scored inside game canvas are recorded back to server balance
  const handlePointsRecorded = (creditsEarned: number, newBalance: number, msg: string) => {
    setUser((prev) => prev ? { ...prev, credits: newBalance } : null);
    showToast("success", "Saldo Sincronizado", msg);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col font-sans select-none antialiased">
      
      {/* Header element */}
      <Header
        user={user}
        onLoginClick={() => {
          setAuthMode("login");
          setAuthOpen(true);
        }}
        onRegisterClick={() => {
          setAuthMode("register");
          setAuthOpen(true);
        }}
        onLogout={handleLogOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setSearchQuery(""); // clean search upon categories switch
        }}
        onClaimDaily={handleClaimDaily}
        onAddCredits={handleAddCredits}
      />

      {/* Hero promo Section */}
      <Hero
        user={user}
        onCtaClick={() => {
          if (!user) {
            setAuthMode("register");
            setAuthOpen(true);
          } else {
            // Scroll right to the dynamic games selector
            document.getElementById("arcade-catalog")?.scrollIntoView({ behavior: "smooth" });
          }
        }}
      />

      {/* Main Catalog View Grid */}
      <main id="arcade-catalog" className="flex-1 pb-24">
        {loading ? (
          <div className="flex h-60 flex-col items-center justify-center gap-3">
            <span className="text-sm text-[#00ff41] font-mono font-bold tracking-widest animate-pulse uppercase">Conectando ao Terminal...</span>
            <div className="h-1 w-40 rounded bg-[#1c1f26] overflow-hidden relative border border-gray-800">
              <div className="absolute top-0 bottom-0 left-0 bg-[#00ff41] w-1/2 animate-shimmer" style={{ width: "40%", animation: "loading-bar 1.5s infinite" }} />
            </div>
          </div>
        ) : (
          <GameGrid
            games={ARCADE_GAMES}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            onPlaySelect={handlePlaySelect}
          />
        )}
      </main>

      {/* Floating Chat Butler (Gemini Integration) */}
      {!loading && (
        <AIAssistant
          user={user}
          onBalanceUpdated={() => {
            fetchSession();
          }}
        />
      )}

      {/* Auth Modals controller */}
      <AuthModals
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Immersive Game Canvas Player overlay block */}
      {playingGame && (
        <GamePlayer
          game={playingGame}
          user={user}
          onClose={() => setPlayingGame(null)}
          onUpdateCredits={async (newCredits) => {
            setUser((prev) => prev ? { ...prev, credits: newCredits } : null);
            try {
              const backupToken = localStorage.getItem("arcade_session_token");
              const headers: any = { "Content-Type": "application/json" };
              if (backupToken) {
                headers["Authorization"] = `Bearer ${backupToken}`;
              }
              await fetch("/api/usuario/atualizar-saldo", {
                method: "POST",
                headers,
                body: JSON.stringify({ credits: newCredits }),
              });
            } catch (err) {
              console.error("Failed to sync balance server-side:", err);
            }
          }}
          onPointsRecorded={handlePointsRecorded}
        />
      )}

      {/* Custom Retro Toast Notifications container overlay */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className={`p-4 rounded border flex gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md text-left text-xs pointer-events-auto bg-[#121418] border-gray-800 ${
                t.type === "success"
                  ? "border-l-4 border-l-[#00ff41]"
                  : t.type === "warning"
                  ? "border-l-4 border-l-[#ff3131]"
                  : "border-l-4 border-l-blue-500"
              }`}
            >
              {t.type === "success" ? (
                <CheckCircle className="shrink-0 text-[#00ff41]" size={16} />
              ) : t.type === "warning" ? (
                <ShieldAlert className="shrink-0 text-[#ff3131]" size={16} />
              ) : (
                <Sparkles className="shrink-0 text-blue-450" size={16} />
              )}
              <div>
                <p className={`font-black uppercase tracking-tight ${
                  t.type === "success" ? "text-[#00ff41]" : t.type === "warning" ? "text-[#ff3131]" : "text-blue-400"
                }`}>{t.title}</p>
                <p className="text-gray-400 mt-1 leading-snug">{t.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Standard Bottom Credit note bounds */}
      <footer className="border-t border-gray-800 bg-[#0b0c0e] py-8 text-center text-gray-500 text-xs font-mono select-none">
        <p>© 2026 xdogcassino - Todos os direitos reservados.</p>
        <p className="mt-1 text-gray-605">Simulador de entretenimento e apostas virtuais.</p>
      </footer>
    </div>
  );
}
