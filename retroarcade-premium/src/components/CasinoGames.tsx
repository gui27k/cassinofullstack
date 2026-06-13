import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  Coins, 
  RefreshCw, 
  Zap, 
  Bomb, 
  Play, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface CasinoGamesProps {
  gameId: string;
  initialChips: number;
  onScoreUpdate: (newScore: number) => void;
  onGameOverSignal: (finalScore: number) => void;
  soundEnabled: boolean;
}

// Helper for play synth sounds (compatible with app)
const playRetroSound = (type: "win" | "lose" | "click" | "explosion" | "card" | "spin") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "card" || type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "spin") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "explosion") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "win") {
      osc.type = "triangle";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(329.63, now); // E
      osc.frequency.setValueAtTime(392.00, now + 0.08); // G
      osc.frequency.setValueAtTime(523.25, now + 0.16); // High C
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start();
      osc.stop(now + 0.35);
    } else if (type === "lose") {
      osc.type = "sawtooth";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start();
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // block warning
  }
};

export default function CasinoGames({ gameId, initialChips, onScoreUpdate, onGameOverSignal, soundEnabled }: CasinoGamesProps) {
  // In-game chips balance. Initial chips are synchronized
  const [chips, setChips] = useState(initialChips);
  const [gameMessage, setGameMessage] = useState("");
  const [msgColor, setMsgColor] = useState("text-[#00ff41]"); // Hex text class
  
  // Sync starting chips when property is pushed down from parent
  useEffect(() => {
    setChips(initialChips);
  }, [initialChips]);

  // Update parent score whenever chips changes
  useEffect(() => {
    onScoreUpdate(chips);
    if (chips <= 0) {
      // Trigger Game Over after small delay so user sees they lost their last chips
      const timer = setTimeout(() => {
        onGameOverSignal(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [chips]);

  // General handler to change chips balance safely
  const changeChips = (amount: number) => {
    setChips((prev) => {
      const next = Math.max(0, prev + amount);
      return next;
    });
  };

  // Sound triggering proxy
  const sfx = (type: "win" | "lose" | "click" | "explosion" | "card" | "spin") => {
    if (soundEnabled) {
      playRetroSound(type);
    }
  };

  // ==========================================
  // GAME #1: BLACKJACK
  // ==========================================
  const CARD_SUITS = ["♠", "♥", "♦", "♣"];
  const CARD_VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  interface BlackjackCard {
    suit: string;
    value: string;
  }

  const [deck, setDeck] = useState<BlackjackCard[]>([]);
  const [playerHand, setPlayerHand] = useState<BlackjackCard[]>([]);
  const [dealerHand, setDealerHand] = useState<BlackjackCard[]>([]);
  const [bjBet, setBjBet] = useState(10);
  const [bjStage, setBjStage] = useState<"ready" | "playing" | "dealer-turn" | "finished">("ready");

  // Tiger Slots Card Reveal Feature
  const [tigerCardActive, setTigerCardActive] = useState(false);
  const [tigerCardRevealed, setTigerCardRevealed] = useState(false);
  const [tigerCardMult, setTigerCardMult] = useState(1);

  // Ox Slots Golden Bull Feature
  const [oxCardActive, setOxCardActive] = useState(false);
  const [oxCardRevealed, setOxCardRevealed] = useState(false);
  const [oxCardMult, setOxCardMult] = useState(1);

  const buildDeck = () => {
    const newDeck: BlackjackCard[] = [];
    for (const suit of CARD_SUITS) {
      for (const value of CARD_VALUES) {
        newDeck.push({ suit, value });
      }
    }
    // Simple shuffle
    return newDeck.sort(() => Math.random() - 0.5);
  };

  const getCardValue = (card: BlackjackCard) => {
    if (["J", "Q", "K"].includes(card.value)) return 10;
    if (card.value === "A") return 11;
    return parseInt(card.value, 10);
  };

  const calculateHandScore = (hand: BlackjackCard[]) => {
    let sum = 0;
    let aces = 0;
    for (const card of hand) {
      sum += getCardValue(card);
      if (card.value === "A") aces++;
    }
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }
    return sum;
  };

  const startBlackjackRound = () => {
    if (chips < bjBet) {
      setGameMessage("Saldo de Fichas Insuficiente para essa aposta!");
      setMsgColor("text-[#ff3131]");
      sfx("lose");
      return;
    }

    sfx("click");
    changeChips(-bjBet);
    
    const initialDeck = buildDeck();
    const p1 = initialDeck.pop()!;
    const d1 = initialDeck.pop()!;
    const p2 = initialDeck.pop()!;
    const d2 = initialDeck.pop()!;

    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setDeck(initialDeck);
    
    // Check instant blackjack
    const pTotal = calculateHandScore([p1, p2]);
    if (pTotal === 21) {
      // Blackjack!
      setBjStage("finished");
      const prize = Math.floor(bjBet * 2.5);
      changeChips(prize);
      setGameMessage(`Natural Blackjack! Você ganhou R$ ${prize.toFixed(2)} equivalentes de fichas!`);
      setMsgColor("text-[#00ff41]");
      sfx("win");
    } else {
      setBjStage("playing");
      setGameMessage("Sua vez! Compre cartas ou decida parar.");
      setMsgColor("text-gray-300");
    }
  };

  const handleBlackjackHit = () => {
    if (bjStage !== "playing") return;
    sfx("card");
    const currentDeck = [...deck];
    const newCard = currentDeck.pop()!;
    const newHand = [...playerHand, newCard];

    setDeck(currentDeck);
    setPlayerHand(newHand);

    const score = calculateHandScore(newHand);
    if (score > 21) {
      setBjStage("finished");
      setGameMessage("Estourou (BUST)! Você ultrapassou 21 pontos.");
      setMsgColor("text-[#ff3131]");
      sfx("lose");
    }
  };

  const handleBlackjackStand = () => {
    if (bjStage !== "playing") return;
    setBjStage("dealer-turn");
    setGameMessage("Turno do Dealer de revelar as cartas...");
    setMsgColor("text-yellow-400");

    setTimeout(() => {
      let currentDeck = [...deck];
      let currentDealerHand = [...dealerHand];
      
      while (calculateHandScore(currentDealerHand) < 17) {
        const c = currentDeck.pop()!;
        currentDealerHand.push(c);
      }

      setDeck(currentDeck);
      setDealerHand(currentDealerHand);
      setBjStage("finished");

      const playerFinal = calculateHandScore(playerHand);
      const dealerFinal = calculateHandScore(currentDealerHand);

      if (dealerFinal > 21) {
        const prize = bjBet * 2;
        changeChips(prize);
        setGameMessage(`O Dealer estourou com ${dealerFinal}! Você ganhou R$ ${prize.toFixed(2)}!`);
        setMsgColor("text-[#00ff41]");
        sfx("win");
      } else if (playerFinal > dealerFinal) {
        const prize = bjBet * 2;
        changeChips(prize);
        setGameMessage(`Vencedor! ${playerFinal} vs ${dealerFinal}. Ganhou R$ ${prize.toFixed(2)}!`);
        setMsgColor("text-[#00ff41]");
        sfx("win");
      } else if (playerFinal === dealerFinal) {
        changeChips(bjBet);
        setGameMessage(`Empate de ${playerFinal} pontos! Seu saldo apostado foi devolvido.`);
        setMsgColor("text-yellow-300");
        sfx("click");
      } else {
        setGameMessage(`Dealer Venceu com ${dealerFinal} contra seus ${playerFinal}.`);
        setMsgColor("text-[#ff3131]");
        sfx("lose");
      }
    }, 1200);
  };


  // ==========================================
  // GAME #2: VEGAS SLOTS (3-REEL DYNAMIC - FORTUNE TIGER & FORTUNE OX EDITION)
  // ==========================================
  const SLOT_EMOJIS = gameId === "ox" 
    ? ["🐂", "🍊", "🎋", "💰", "🧧", "☯️", "💎", "7️⃣"] 
    : ["🐯", "🍊", "🔔", "💰", "🧧", "⭐", "💎", "7️⃣"];

  const [reels, setReels] = useState<string[]>(gameId === "ox" ? ["🐂", "🐂", "🐂"] : ["🐯", "🐯", "🐯"]);
  const [spinning, setSpinning] = useState(false);
  const [slotsBet, setSlotsBet] = useState(10);

  const spinVegasSlots = () => {
    if (chips < slotsBet) {
      setGameMessage("Saldo de Fichas Insuficiente para essa aposta!");
      setMsgColor("text-[#ff3131]");
      sfx("lose");
      return;
    }

    setSpinning(true);
    setGameMessage("Reclame sua sorte, girando bobinas...");
    setMsgColor("text-gray-400");
    changeChips(-slotsBet);

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
        SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)]
      ]);
      sfx("spin");
      count++;
      if (count > 12) {
        clearInterval(interval);
        setSpinning(false);
        
        // Compute results
        const finalReels = [
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)],
          SLOT_EMOJIS[Math.floor(Math.random() * SLOT_EMOJIS.length)]
        ];
        setReels(finalReels);

        const [r1, r2, r3] = finalReels;
        if (r1 === r2 && r2 === r3) {
          // Jackpot 3/3
          let mult = 10;
          if (r1 === "7️⃣") mult = 30;
          else if (r1 === "💎" || r1 === "☯️") mult = 20;
          else if (r1 === "🐯" || r1 === "🐂") mult = 15;

          const prize = Math.floor(slotsBet * mult);
          changeChips(prize);
          setGameMessage(`SUPER JACKPOT de ${r1}! Ganhou R$ ${prize.toFixed(2)} em fichas!`);
          setMsgColor("text-yellow-400 font-extrabold");
          sfx("win");
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
          // Double match
          const prize = Math.floor(slotsBet * 2);
          changeChips(prize);
          setGameMessage(`Dupla correspondência! Você faturou R$ ${prize.toFixed(2)}!`);
          setMsgColor("text-amber-400 font-bold");
          sfx("win");
        } else {
          setGameMessage(`Bobinas pararam. Tente rodar mais uma vez! (-R$ ${slotsBet})`);
          setMsgColor("text-gray-500");
          sfx("lose");
        }

        // Random Tiger / Ox bonus feature trigger (22% chance of activation on any spin!)
        const deservesBonus = Math.random() < 0.22;
        if (deservesBonus) {
          setTimeout(() => {
            if (gameId === "slots") {
              const multipliers = [8, 12, 15, 25, 50];
              const randomMult = multipliers[Math.floor(Math.random() * multipliers.length)];
              setTigerCardMult(randomMult);
              setTigerCardRevealed(false);
              setTigerCardActive(true);
              sfx("win");
            } else if (gameId === "ox") {
              const multipliers = [10, 15, 20, 30, 60];
              const randomMult = multipliers[Math.floor(Math.random() * multipliers.length)];
              setOxCardMult(randomMult);
              setOxCardRevealed(false);
              setOxCardActive(true);
              sfx("win");
            }
          }, 1000);
        }
      }
    }, 100);
  };


  // ==========================================
  // GAME #3: LUCKY MINES (BOMBAS RETRO)
  // ==========================================
  const [mineGrid, setMineGrid] = useState<Array<{ id: number; revealed: boolean; type: "empty" | "bomb" | "gem" }>>([]);
  const [bombCount, setBombCount] = useState(3);
  const [minesBet, setMinesBet] = useState(10);
  const [minesActive, setMinesActive] = useState(false);
  const [minesMult, setMinesMult] = useState(1.0);
  const [mineRoundsWon, setMineRoundsWon] = useState(0);

  const initMinesBoard = () => {
    if (chips < minesBet) {
      setGameMessage("Saldo de Fichas Insuficiente para abrir as minas!");
      setMsgColor("text-[#ff3131]");
      sfx("lose");
      return;
    }

    sfx("click");
    changeChips(-minesBet);
    setMinesActive(true);
    setMinesMult(1.0);
    setMineRoundsWon(0);
    setGameMessage("Campo minado preparado! Clique para achar Diamantes 💎");
    setMsgColor("text-gray-300");

    // Distribute random bombs
    const bombIndices: number[] = [];
    while (bombIndices.length < bombCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!bombIndices.includes(idx)) {
        bombIndices.push(idx);
      }
    }

    const grid = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      revealed: false,
      type: bombIndices.includes(i) ? ("bomb" as const) : ("gem" as const)
    }));
    setMineGrid(grid);
  };

  const clickMineCell = (cellId: number) => {
    if (!minesActive) return;
    const current = mineGrid.find((c) => c.id === cellId);
    if (!current || current.revealed) return;

    if (current.type === "bomb") {
      sfx("explosion");
      setMinesActive(false);
      // Reveal all bombs
      setMineGrid((prev) =>
        prev.map((c) => (c.type === "bomb" ? { ...c, revealed: true } : c))
      );
      setGameMessage("BOOOM! Você acertou uma bomba explosiva.");
      setMsgColor("text-[#ff3131]");
    } else {
      sfx("card");
      setMineGrid((prev) =>
        prev.map((c) => (c.id === cellId ? { ...c, revealed: true } : c))
      );
      
      const newWins = mineRoundsWon + 1;
      setMineRoundsWon(newWins);
      
      // Calculate multiplier dynamic scale
      const multGained = 1.0 + (newWins * (0.12 + bombCount * 0.05));
      setMinesMult(multGained);
      setGameMessage(`Excelente! Multiplicador atualizado para ${multGained.toFixed(2)}x!`);
      setMsgColor("text-yellow-300");
    }
  };

  const cashoutMinesReward = () => {
    if (!minesActive) return;
    const finalPrize = Math.floor(minesBet * minesMult);
    changeChips(finalPrize);
    setMinesActive(false);
    
    // Reveal everything
    setMineGrid((prev) => prev.map((c) => ({ ...c, revealed: true })));
    setGameMessage(`Sacado com Sucesso! +R$ ${finalPrize.toFixed(2)} adicionados ao seu saldo!`);
    setMsgColor("text-[#00ff41]");
    sfx("win");
  };


  // ==========================================
  // GAME #4: CRASH (ESTRELA AVIATOR)
  // ==========================================
  const [crashBet, setCrashBet] = useState(10);
  const [crashActive, setCrashActive] = useState(false);
  const [crashMult, setCrashMult] = useState(1.0);
  const [crashStatus, setCrashStatus] = useState<"holding" | "flying" | "crashed">("holding");
  const crashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerStarCrashGame = () => {
    if (chips < crashBet) {
      setGameMessage("Saldo de Fichas Insuficiente para decolar!");
      setMsgColor("text-[#ff3131]");
      sfx("lose");
      return;
    }

    sfx("click");
    changeChips(-crashBet);
    setCrashActive(true);
    setCrashStatus("flying");
    setCrashMult(1.0);
    setGameMessage("O foguete retro decolou! Resgate seu saldo antes que exploda!");
    setMsgColor("text-zinc-300");

    // Random crash threshold between 1.10x and 6.00x
    const randomCrashRate = 1.05 + Math.random() * 4.95;
    
    let currentMultiplier = 1.0;
    
    if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
    
    crashIntervalRef.current = setInterval(() => {
      currentMultiplier += 0.04;
      setCrashMult(currentMultiplier);
      
      if (currentMultiplier >= randomCrashRate) {
        clearInterval(crashIntervalRef.current!);
        setCrashStatus("crashed");
        setCrashActive(false);
        setGameMessage(`Explodiu! O foguete estourou em ${randomCrashRate.toFixed(2)}x.`);
        setMsgColor("text-[#ff3131]");
        sfx("explosion");
      } else {
        sfx("spin");
      }
    }, 120);
  };

  const cashoutCrashMultiplier = () => {
    if (crashStatus !== "flying" || !crashActive) return;
    if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);

    const finalPrize = Math.floor(crashBet * crashMult);
    changeChips(finalPrize);
    setCrashActive(false);
    setCrashStatus("holding");
    setGameMessage(`Sucesso! Parou em ${crashMult.toFixed(2)}x faturando +R$ ${finalPrize.toFixed(2)}!`);
    setMsgColor("text-[#00ff41]");
    sfx("win");
  };

  useEffect(() => {
    return () => {
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
    };
  }, []);


  // ==========================================
  // RENDER SECTIONS
  // ==========================================
  return (
    <div className="w-full text-center py-2 h-full flex flex-col justify-between">
      
      {/* Mini Top Dashboard chips balance indicator */}
      <div className="flex justify-between items-center bg-[#1c1f26] border border-gray-800/80 p-3.5 rounded-xl mb-5 select-none shrink-0 font-bold">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
          <Coins size={14} className="text-[#00ff41]" />
          FICHAS DE JOGO NESTA MESA
        </span>
        <span className="text-xl font-mono text-[#00ff41] bg-black/40 px-3 py-1.5 rounded border border-gray-850 shadow-inner">
          R$ {chips.toFixed(2)}
        </span>
      </div>

      {/* Main Game Interface Board wrapper */}
      <div className="flex-1 flex flex-col justify-center items-center py-2">
        {gameId === "blackjack" && (
          <div className="w-full max-w-xl text-left space-y-4">
            
            {/* Dealer Row */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-extrabold font-mono tracking-wider">Mão da Banca (Dealer)</span>
              <div className="flex gap-2 min-h-[90px] items-center bg-zinc-950/40 p-2.5 rounded border border-gray-800/50">
                {dealerHand.map((c, idx) => (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={idx}
                    className={`h-20 w-14 bg-white rounded border-2 shadow-md flex flex-col justify-between p-1.5 ${
                      ["♥", "♦"].includes(c.suit) ? "text-[#ff3131]" : "text-black"
                    }`}
                  >
                    {/* Hide second card if playing */}
                    {idx === 1 && bjStage === "playing" ? (
                      <div className="flex-1 bg-red-800/90 rounded flex items-center justify-center text-white text-[10px] font-bold">🎯</div>
                    ) : (
                      <>
                        <span className="text-[11px] font-black leading-none">{c.value}</span>
                        <span className="text-xl text-center self-center">{c.suit}</span>
                        <span className="text-[11px] font-black leading-none text-right">{c.value}</span>
                      </>
                    )}
                  </motion.div>
                ))}
                {dealerHand.length > 0 && bjStage !== "playing" && (
                  <span className="text-xs bg-black/60 px-2 py-1 rounded text-white ml-2">
                    Total: {calculateHandScore(dealerHand)}
                  </span>
                )}
              </div>
            </div>

            {/* Player Row */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase text-gray-500 font-extrabold font-mono tracking-wider">Sua Mão</span>
              <div className="flex gap-2 min-h-[90px] items-center bg-zinc-950/40 p-2.5 rounded border border-gray-800/50">
                {playerHand.map((c, idx) => (
                  <motion.div
                    initial={{ scale: 0.8, y: 15, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    key={idx}
                    className={`h-20 w-14 bg-white rounded border-2 shadow-md flex flex-col justify-between p-1.5 ${
                      ["♥", "♦"].includes(c.suit) ? "text-[#ff3131]" : "text-black"
                    }`}
                  >
                    <span className="text-[11px] font-black leading-none">{c.value}</span>
                    <span className="text-xl text-center self-center">{c.suit}</span>
                    <span className="text-[11px] font-black leading-none text-right">{c.value}</span>
                  </motion.div>
                ))}
                {playerHand.length > 0 && (
                  <span className="text-xs bg-black/60 px-2 py-1 rounded text-white ml-2">
                    Total: {calculateHandScore(playerHand)}
                  </span>
                )}
              </div>
            </div>

            {/* Custom Betting action controller bar */}
            <div className="flex flex-wrap gap-2.5 items-center justify-center pt-2 bg-black/35 p-3 rounded-lg border border-gray-900">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase tracking-widest text-gray-400 font-bold ml-1 mb-1">Aposta</span>
                <select
                  disabled={bjStage === "playing" || bjStage === "dealer-turn"}
                  value={bjBet}
                  onChange={(e) => setBjBet(parseInt(e.target.value, 10))}
                  className="bg-[#121418] border border-gray-700 rounded text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-[#00ff41]"
                >
                  <option value={10}>R$ 10,00</option>
                  <option value={25}>R$ 25,00</option>
                  <option value={50}>R$ 50,00</option>
                  <option value={100}>R$ 100,00</option>
                </select>
              </div>

              {bjStage === "ready" || bjStage === "finished" ? (
                <button
                  onClick={startBlackjackRound}
                  className="px-5 py-2.5 bg-[#00ff41] text-black text-xs font-black uppercase rounded cursor-pointer hover:bg-[#00e039] transition active:scale-95 flex items-center gap-1 mt-3"
                >
                  <Play size={10} className="fill-current" /> Começar Nova Rodada
                </button>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleBlackjackHit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded cursor-pointer transition active:scale-95"
                  >
                    Comprar (+1)
                  </button>
                  <button
                    onClick={handleBlackjackStand}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase rounded cursor-pointer transition active:scale-95"
                  >
                    Parar / Decidir
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {(gameId === "slots" || gameId === "ox") && (
          <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
            
            <div className="text-center">
              <span className="text-[10px] font-mono font-black tracking-widest text-[#00ff41] uppercase animate-pulse block">
                {gameId === "slots" ? "🐯 ORIENTAL PG GOLDEN 🐯" : "🐂 MULTI-GOLD TOURO 🐂"}
              </span>
              <h4 className="text-lg font-black italic uppercase text-white mt-0.5 tracking-tight">
                {gameId === "slots" ? "Fortune Tiger Slots" : "Fortune Ox Slots"}
              </h4>
            </div>

            {/* Spinning wheels layout container */}
            <div className={`flex gap-4 p-5 bg-[#0a0c0e] rounded-2xl border-4 shadow-inner transition-all ${
              gameId === "ox"
                ? "border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                : "border-[#ff3131] shadow-[0_0_25px_rgba(255,49,49,0.3)]"
            }`}>
              {reels.map((symbol, idx) => (
                <motion.div
                  animate={spinning ? { y: [0, -15, 15, 0], scale: [1, 1.1, 0.9, 1] } : {}}
                  transition={{ repeat: spinning ? Infinity : 0, duration: 0.15 }}
                  key={idx}
                  className="h-20 w-20 bg-[#121418] rounded-xl border border-gray-700/80 shadow flex items-center justify-center text-4xl select-none"
                >
                  {symbol}
                </motion.div>
              ))}
            </div>

            {/* Inputs controls panel */}
            <div className="flex items-center gap-3 bg-[#13151b] p-3 rounded-lg border border-gray-800">
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-widest text-gray-500 font-extrabold ml-1">Aposta do Giro</span>
                <select
                  disabled={spinning}
                  value={slotsBet}
                  onChange={(e) => setSlotsBet(parseInt(e.target.value, 10))}
                  className="bg-[#121418] border border-gray-700/80 rounded text-xs text-white px-2 py-1 focus:outline-none focus:border-[#00ff41] mt-1"
                >
                  <option value={10}>R$ 10,00</option>
                  <option value={25}>R$ 25,00</option>
                  <option value={50}>R$ 50,00</option>
                  <option value={100}>R$ 100,00</option>
                </select>
              </div>

              <button
                disabled={spinning}
                onClick={spinVegasSlots}
                className={`px-6 py-2 text-black font-black text-xs uppercase rounded cursor-pointer transition active:scale-95 disabled:opacity-50 mt-2 flex items-center gap-1.5 ${
                  gameId === "ox"
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-[#00ff41] hover:bg-[#00e039]"
                }`}
              >
                <RefreshCw size={12} className={spinning ? "animate-spin" : ""} />
                {spinning ? "GIRANDO..." : "GIRAR SLOTS"}
              </button>
            </div>

          </div>
        )}

        {gameId === "mines" && (
          <div className="w-full max-w-md space-y-5">
            
            {/* Campo Minado 5x5 Grid */}
            <div className="grid grid-cols-5 gap-2 bg-[#0b0c0e] p-4 rounded-xl border border-gray-800/80 max-w-[320px] mx-auto">
              {mineGrid.length === 0 ? (
                <div className="col-span-5 h-[270px] flex items-center justify-center text-gray-400 font-mono text-xs text-center border border-dashed border-gray-800 rounded">
                  Configure a aposta abaixo <br />para ver o campo de minas.
                </div>
              ) : (
                mineGrid.map((c) => (
                  <button
                    key={c.id}
                    disabled={!minesActive || c.revealed}
                    onClick={() => clickMineCell(c.id)}
                    className={`aspect-square rounded flex items-center justify-center text-xl transition-all font-bold cursor-pointer ${
                      c.revealed 
                        ? c.type === "bomb"
                          ? "bg-red-950/80 border-2 border-red-500 text-white"
                          : "bg-emerald-950/80 border-2 border-emerald-500 text-[#00ff41]"
                        : "bg-[#1c1f26] border border-gray-700/60 hover:bg-[#2e3440] hover:border-zinc-500 text-gray-500"
                    }`}
                  >
                    {c.revealed ? (
                      c.type === "bomb" ? "💣" : "💎"
                    ) : (
                      "?"
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Grid controller footer and details */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 bg-black/30 p-3 rounded-lg border border-gray-900">
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase text-gray-500 font-bold mb-1">Bombas</span>
                <select
                  disabled={minesActive}
                  value={bombCount}
                  onChange={(e) => setBombCount(parseInt(e.target.value, 10))}
                  className="bg-[#121418] border border-gray-700/80 rounded text-xs text-white px-2 py-1.5 focus:outline-none"
                >
                  <option value={2}>2 Bombas</option>
                  <option value={3}>3 Bombas</option>
                  <option value={5}>5 Bombas</option>
                  <option value={7}>7 Bombas</option>
                  <option value={10}>10 Bombas</option>
                </select>
              </div>

              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase text-gray-500 font-bold mb-1">Aposta</span>
                <select
                  disabled={minesActive}
                  value={minesBet}
                  onChange={(e) => setMinesBet(parseInt(e.target.value, 10))}
                  className="bg-[#121418] border border-gray-700/80 rounded text-xs text-white px-2 py-1.5 focus:outline-none"
                >
                  <option value={10}>R$ 10,00</option>
                  <option value={25}>R$ 25,00</option>
                  <option value={50}>R$ 50,00</option>
                  <option value={100}>R$ 100,00</option>
                </select>
              </div>

              <div className="mt-3.5 flex gap-2">
                {!minesActive ? (
                  <button
                    onClick={initMinesBoard}
                    className="px-4 py-2 bg-[#00ff41] text-black font-black text-xs uppercase rounded cursor-pointer hover:bg-[#00e039] transition"
                  >
                    Entrar com R$ {minesBet}
                  </button>
                ) : (
                  <button
                    onClick={cashoutMinesReward}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase rounded cursor-pointer animate-pulse transition"
                  >
                    Sacar R$ {(minesBet * minesMult).toFixed(2)} ({minesMult.toFixed(2)}x)
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {gameId === "crash" && (
          <div className="w-full max-w-sm space-y-6">
            
            {/* Visual rising multiplier box */}
            <div className="relative h-44 bg-[#0a0c0e] rounded-xl border border-gray-800/80 flex flex-col justify-center items-center overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              {/* Rocket graphic animation overlay */}
              {crashStatus === "flying" && (
                <motion.div
                  animate={{ y: [0, -10, 5, 0], x: [0, 8, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute bottom-5 left-8 text-4xl select-none"
                >
                  🚀
                </motion.div>
              )}

              {crashStatus === "crashed" && (
                <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-5xl">💥</div>
              )}

              <span className="text-[10px] font-mono tracking-widest text-[#00ff41] font-bold z-10">MULTIPLICADOR ESTRELA</span>
              <h2 className="text-5xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-[#1ebd59] z-10 my-1">
                {crashMult.toFixed(2)}x
              </h2>
              {crashStatus === "flying" && (
                <span className="text-[9px] font-mono text-gray-500 uppercase z-10 animate-pulse">SISTEMA ATIVO... SUBINDO...</span>
              )}
            </div>

            {/* Crash controls row */}
            <div className="flex items-center justify-center gap-3.5 bg-[#121418] p-3 rounded-lg border border-gray-800">
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase tracking-widest text-[#00ff41] font-bold">Aposta</span>
                <select
                  disabled={crashActive}
                  value={crashBet}
                  onChange={(e) => setCrashBet(parseInt(e.target.value, 10))}
                  className="bg-[#121418] border border-gray-700 rounded text-xs text-white px-2.5 py-1 focus:outline-none"
                >
                  <option value={10}>R$ 10,00</option>
                  <option value={25}>R$ 25,00</option>
                  <option value={50}>R$ 50,00</option>
                  <option value={100}>R$ 100,00</option>
                </select>
              </div>

              {!crashActive ? (
                <button
                  onClick={triggerStarCrashGame}
                  className="px-5 py-2 bg-[#00ff41] hover:bg-[#00e039] text-black font-black text-xs uppercase rounded cursor-pointer mt-3 transition active:scale-95 flex items-center gap-1.5"
                >
                  <Play size={10} className="fill-current" /> Decolar Foguete
                </button>
              ) : (
                <button
                  onClick={cashoutCrashMultiplier}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase rounded cursor-pointer mt-3 animate-pulse transition active:scale-95"
                >
                  Sacar R$ {(crashBet * crashMult).toFixed(2)}
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Fortune Tiger Special Card Modal */}
      <AnimatePresence>
        {tigerCardActive && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-red-950 to-amber-950 border-2 border-yellow-400 rounded-3xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.4)] text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              
              <span className="text-xs font-mono text-yellow-300 font-extrabold tracking-widest uppercase block mb-1">🐯 RECURSO DA SORTE 🐯</span>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-4">CARTA DE MULTIPLICADOR DO TIGRINHO</h3>
              
              <div className="bg-black/60 rounded-2xl p-4 border border-yellow-500/20 mb-6 min-h-[140px] flex flex-col items-center justify-center relative">
                {!tigerCardRevealed ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTigerCardRevealed(true);
                      const winAmount = Math.floor(slotsBet * tigerCardMult);
                      changeChips(winAmount);
                      sfx("win");
                    }}
                    className="h-28 w-20 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-xl shadow-xl flex flex-col items-center justify-center cursor-pointer border-2 border-white select-none group"
                  >
                    <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🐯</span>
                    <span className="text-[9px] font-black text-black uppercase tracking-wider mt-2 bg-white px-2.5 py-0.5 rounded-full select-none">ABRIR</span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-5xl font-mono animate-bounce mb-2">🧧</span>
                    <span className="text-amber-400 text-3xl font-black font-mono tracking-tight bg-yellow-950/50 px-4 py-1.5 rounded-full border border-yellow-500/50">
                      MULTIPLICADOR {tigerCardMult}x!
                    </span>
                    <p className="text-xs text-white/95 font-bold mt-4">
                      O Tigrinho te abençoou com <strong className="text-[#00ff41] font-mono">R$ {(slotsBet * tigerCardMult).toLocaleString("pt-BR")},00</strong> extras!
                    </p>
                  </motion.div>
                )}
              </div>

              {tigerCardRevealed && (
                <button
                  onClick={() => setTigerCardActive(false)}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase text-xs rounded-xl tracking-wider transition cursor-pointer"
                >
                  Confirmar e Voltar ao Jogo
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fortune Ox Special Card Modal */}
      <AnimatePresence>
        {oxCardActive && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-sm bg-gradient-to-b from-amber-955 to-red-955 border-2 border-amber-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
              
              <span className="text-xs font-mono text-amber-300 font-extrabold tracking-widest uppercase block mb-1">🐂 TOURO DE OURO 🐂</span>
              <h3 className="text-xl font-black italic text-white uppercase tracking-tighter mb-4">RECURSO MULTI-GIRE ATIVADO</h3>
              
              <div className="bg-black/60 rounded-2xl p-4 border border-amber-500/20 mb-6 min-h-[140px] flex flex-col items-center justify-center relative">
                {!oxCardRevealed ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setOxCardRevealed(true);
                      const winAmount = Math.floor(slotsBet * oxCardMult);
                      changeChips(winAmount);
                      sfx("win");
                    }}
                    className="h-28 w-20 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-xl shadow-xl flex flex-col items-center justify-center cursor-pointer border-2 border-white select-none group"
                  >
                    <span className="text-4xl filter drop-shadow group-hover:scale-110 transition-transform">🐂</span>
                    <span className="text-[9px] font-black text-black uppercase tracking-wider mt-2 bg-white px-2.5 py-0.5 rounded-full select-none">ABRIR</span>
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-5xl font-mono animate-bounce mb-2">🎁</span>
                    <span className="text-yellow-400 text-3xl font-black font-mono tracking-tight bg-orange-950/50 px-4 py-1.5 rounded-full border border-orange-500/50">
                      TOURO GIRO {oxCardMult}x!
                    </span>
                    <p className="text-xs text-white/95 font-bold mt-4">
                      O Touro da Fortuna te abençoou com <strong className="text-[#00ff41] font-mono">R$ {(slotsBet * oxCardMult).toLocaleString("pt-BR")},00</strong> extras!
                    </p>
                  </motion.div>
                )}
              </div>

              {oxCardRevealed && (
                <button
                  onClick={() => setOxCardActive(false)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs rounded-xl tracking-wider transition cursor-pointer"
                >
                  Confirmar e Voltar ao Jogo
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Middle Game Notification Banner message box */}
      <div className="h-14 font-mono select-none flex items-center justify-center text-center px-4 mt-1 bg-zinc-950/20 rounded border border-gray-900/60 shrink-0">
        <span className={`text-xs ${msgColor} leading-relaxed font-bold`}>{gameMessage || "Prepare as apostas e comece sua diversão!"}</span>
      </div>

    </div>
  );
}
