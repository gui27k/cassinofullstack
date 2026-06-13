import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Enable JSON parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory storage
interface UserDb {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Stored securely
  credits: number;
  avatarSeed: string;
  createdAt: string;
  lastDailyClaim?: string;
}

const usersStore: Map<string, UserDb> = new Map();
const sessionsStore: Map<string, string> = new Map(); // token -> userId

// Prepopulate database with a sample user for automated or easy manual testing
const demoUserHash = crypto.createHash("sha256").update("password123").digest("hex");
usersStore.set("demo@xdogcassino.com", {
  id: "user-demo-123",
  name: "Dog Tester",
  email: "demo@xdogcassino.com",
  passwordHash: demoUserHash,
  credits: 1000,
  avatarSeed: "mario",
  createdAt: new Date().toISOString(),
});

// Helper: retrieve user from token or Authorization header
function getAssociatedUser(req: express.Request): UserDb | null {
  let token = "";

  // 1. Try to read from Cookie header manually
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc: any, curr) => {
      const parts = curr.split("=");
      acc[parts[0].trim()] = (parts[1] || "").trim();
      return acc;
    }, {});
    token = cookies["arcade_session"] || "";
  }

  // 2. Try to read from Authorization header if Cookie is blocked or missing (robust backup)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const userId = sessionsStore.get(token);
  if (!userId) return null;

  // Find user in users map
  for (const user of usersStore.values()) {
    if (user.id === userId) {
      return user;
    }
  }

  return null;
}

// ==========================================
// API AUTH & USER ENDPOINTS
// ==========================================

// Get Current User Profile and balance
app.get("/api/usuario/me", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      avatarSeed: user.avatarSeed,
      createdAt: user.createdAt,
    },
  });
});

// Register User
app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Por favor, preencha todos os campos." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (usersStore.has(normalizedEmail)) {
    return res.status(400).json({ error: "Este e-mail já está sendo utilizado." });
  }

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const userId = "user-" + crypto.randomUUID();
  const avatarSeed = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "gamer";

  const newUser: UserDb = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    credits: 1000, // Starts with 1000 fictitious credits
    avatarSeed,
    createdAt: new Date().toISOString(),
  };

  usersStore.set(normalizedEmail, newUser);

  // Auto-generate session token
  const token = crypto.randomUUID();
  sessionsStore.set(token, userId);

  // Set HTTPOnly cookie (secure settings adjusted for iframe/local integration)
  res.cookie("arcade_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({
    success: true,
    token, // Return token directly on JSON in case cookies are blocked inside the sandboxed iframe
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      credits: newUser.credits,
      avatarSeed: newUser.avatarSeed,
      createdAt: newUser.createdAt,
    },
  });
});

// Login User
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = usersStore.get(normalizedEmail);

  if (!user) {
    return res.status(400).json({ error: "Credenciais inválidas." });
  }

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  if (user.passwordHash !== passwordHash) {
    return res.status(400).json({ error: "Credenciais inválidas." });
  }

  const token = crypto.randomUUID();
  sessionsStore.set(token, user.id);

  res.cookie("arcade_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      avatarSeed: user.avatarSeed,
      createdAt: user.createdAt,
    },
  });
});

// Logout User
app.post("/api/auth/logout", (req, res) => {
  let token = "";
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").reduce((acc: any, curr) => {
      const parts = curr.split("=");
      acc[parts[0].trim()] = (parts[1] || "").trim();
      return acc;
    }, {});
    token = cookies["arcade_session"] || "";
  }

  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (token) {
    sessionsStore.delete(token);
  }

  res.clearCookie("arcade_session");
  return res.json({ success: true, message: "Sessão encerrada." });
});

// Request free Daily Credits recharge (fictional reward)
app.post("/api/usuario/daily-claim", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const todayStr = new Date().toDateString();
  if (user.lastDailyClaim === todayStr) {
    return res.status(400).json({ error: "Você já resgatou seus créditos hoje! Tente novamente amanhã." });
  }

  // Grant 500 rewards
  user.credits += 500;
  user.lastDailyClaim = todayStr;

  return res.json({
    success: true,
    credits: user.credits,
    message: "Parabéns! 500 créditos foram adicionados à sua conta arcade.",
  });
});

// Recharge / Purchase mock credits (instant simulation)
app.post("/api/usuario/recarregar", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Não autorizado para recarga." });
  }

  const { amount } = req.body;
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Valor de recarga inválido." });
  }

  user.credits += numAmount;

  return res.json({
    success: true,
    credits: user.credits,
    message: `Recarga de R$ ${numAmount.toLocaleString("pt-BR")},00 efetuada com sucesso!`,
  });
});

// Update client balance in real-time
app.post("/api/usuario/atualizar-saldo", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Sessão expirada." });
  }

  const { credits } = req.body;
  const numCredits = parseInt(credits, 10);
  if (isNaN(numCredits) || numCredits < 0) {
    return res.status(400).json({ error: "Saldo inválido." });
  }

  user.credits = numCredits;

  return res.json({
    success: true,
    credits: user.credits,
    message: "Saldo atualizado com sucesso!",
  });
});

// ==========================================
// ARCADE GAMES CONTROLLER ENDPOINTS
// ==========================================

// Deduct credits to play a premium game (Costs 0 credits - Free access)
app.post("/api/jogos/jogar", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Faça login para poder acessar as mesas." });
  }

  // Cost is 0 now: free to sit/enter table
  const playCost = 0;
  if (user.credits < playCost) {
    return res.status(400).json({ error: "Saldo insuficiente!" });
  }

  user.credits -= playCost;

  return res.json({
    success: true,
    credits: user.credits,
    message: "Mesa liberada com sucesso!",
  });
});

// Submit final score and award reward credits
app.post("/api/jogos/pontuar", (req, res) => {
  const user = getAssociatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "Sessão expirada para pontuação." });
  }

  const { gameId, score } = req.body;
  const numScore = parseInt(score, 10);

  if (isNaN(numScore) || numScore < 0) {
    return res.status(400).json({ error: "Pontuação inválida." });
  }

  // Update credits directly to score value
  user.credits = numScore;

  return res.json({
    success: true,
    score: numScore,
    creditsEarned: 0,
    credits: user.credits,
    message: `Saldos sincronizados com o servidor central! Seu saldo é de R$ ${user.credits.toLocaleString("pt-BR")},00`,
  });
});

// ==========================================
// IN-APP AI ARCADE BUTLER (GEMINI INTEGRATION)
// ==========================================
app.post("/api/ai/chat", async (req, res) => {
  const user = getAssociatedUser(req);
  const { message, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensagem vazia." });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({
        response: "Olá! Sou o XDog Butler, seu assistente virtual e consultor da xdogcassino. (Nota: Chave de API do Gemini não registrada no Secrets - Executando em contingência offline). Sinta-se à vontade para simular suas rodadas nos nossos novos simuladores Mines Strategy, Crash Velocity, Retro Slots e Royal Blackjack!",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // We build a stylized retro chatbot experience
    const userName = user ? user.name : "Jogador Convidado";
    const userCredits = user ? `R$ ${user.credits.toLocaleString("pt-BR")},00` : "Deslogado (sem saldo de testes)";

    const systemInstruction = `Você é o "XDog Butler", o concierge virtual e consultor super carismático e inteligente do xdogcassino (a plataforma virtual premium e simulador casual de casino online). Suas características essenciais:
1. Seu tom é elegante, polido, focado em alta fidelidade e alta gastronomia de Las Vegas, amigável e focado no entretenimento seguro e diversão virtual sem dinheiro real.
2. Você dá dicas táticas excepcionais sobre nossos 4 simuladores integrados:
   - "Mines Strategy" (PG Soft): Abra as células com malícia, evite as minas explosivas, descubra diamantes e saque seus multiplicadores na hora prudente!
   - "Crash Velocity" (Evolution): O rocket acelera multiplicando seu saldo! Resgate seus lucros antes que o rocket atinja a velocidade terminal e exploda!
   - "Retro Slots" (NetEnt): Faça as bobinas brilhantes neon rodarem e se alinharem para faturar jackpots incríveis.
   - "Royal Blackjack" (Pragmatic Play): O destaque da semana! Seja inteligente contra o dealer virtual, peça cartas ou dobre para chegar perto de 21 sem estourar.
3. Lembre o jogador de que o saldo é 100% fictício de testes para pura simulação de entretenimento gratuito.
4. Responda sempre em Português do Brasil com excelente estilo Markdown (negrito, marcadores elegantes), focado em fornecer respostas concisas, diretas e úteis.
5. Dados do jogador conversando com você: Nome: ${userName}, Saldo de Testes Atual: ${userCredits}. Personalize a sua cordialidade mencionando-o com carinho!`;

    // Process history if provided
    const formattedHistory = (chatHistory || []).map((h: any) => {
      return {
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      };
    });

    // Run generateContent call
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [...formattedHistory, { role: "user", parts: [{ text: message }] }],
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    const reply = response.text || "Hum, tive um soluço de rede retro. Tente me perguntar novamente, colega gamer!";
    return res.json({ response: reply });
  } catch (err: any) {
    console.error("Gemini system error:", err);
    return res.json({
      response: "Max Retro: Opa! Parece que meu processador de 16-bits deu um pequeno bug na resposta. Mas ainda estou aqui! Deseja jogar ou precisa de ajuda com seu saldo de créditos?",
    });
  }
});

// Use Vite or static build depending on production mode
const isProd = process.env.NODE_ENV === "production";

async function bootServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // This serves index.html and typescript files on the fly
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RetroArcade Backend] rodando em http://localhost:${PORT}`);
  });
}

bootServer();
