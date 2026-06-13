export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  avatarSeed: string;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  developer: string;
  imagePath: string;
  tags: string[];
  premiumCost: number;
  difficulty: "Fácil" | "Médio" | "Difícil";
  playsCount: number;
}

export interface SessionResponse {
  authenticated: boolean;
  user: User | null;
}
