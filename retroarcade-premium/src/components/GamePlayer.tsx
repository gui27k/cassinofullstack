import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Trophy, RefreshCw, Zap, Volume2, VolumeX, ArrowLeft, ArrowRight, ShieldCheck, Gamepad2 } from "lucide-react";
import { Game } from "../types";
import CasinoGames from "./CasinoGames";

interface GamePlayerProps {
  game: Game;
  user: any;
  onClose: () => void;
  onUpdateCredits: (newCredits: number) => void;
  onPointsRecorded: (earned: number, newBalance: number, msg: string) => void;
}

// Simple synthesizer sounds using Web Audio API (failsafe & static-free)
const playRetroSound = (type: "laser" | "hit" | "jump" | "success" | "brick") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "laser") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "hit") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "brick") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "jump") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === "success") {
      osc.type = "triangle";
      // Happy fanfare chord sequence
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(261.63, now); // C
      osc.frequency.setValueAtTime(329.63, now + 0.08); // E
      osc.frequency.setValueAtTime(392.00, now + 0.16); // G
      osc.frequency.setValueAtTime(523.25, now + 0.24); // High C
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start();
      osc.stop(now + 0.45);
    }
  } catch (e) {
    console.warn("Web audio blocked or failed to run:", e);
  }
};

export default function GamePlayer({ game, user, onClose, onUpdateCredits, onPointsRecorded }: GamePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isCasinoGame = ["blackjack", "mines", "slots", "crash", "ox"].includes(game.id);
  const [score, setScore] = useState(isCasinoGame ? (user?.credits ?? 1000) : 0);
  const [gameOver, setGameOver] = useState(false);
  const [activeScoreSent, setActiveScoreSent] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Keyboard and screen controls ref
  const controlsRef = useRef({ left: false, right: false, space: false });

  // Handle score updates
  const latestScore = useRef(0);
  useEffect(() => {
    latestScore.current = score;
  }, [score]);

  // Run selected canvas game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed internal size of canvas (gives retro feel but scales responsively via CSS)
    canvas.width = 600;
    canvas.height = 400;

    let animId: number;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number }> = [];

    const createExplosion = (x: number, y: number, color: string = "#22c55e") => {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          radius: Math.random() * 3 + 1,
          color,
          alpha: 1,
        });
      }
    };

    const updateParticles = () => {
      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        return p.alpha > 0;
      });
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
      });
    };

    // ==========================================
    // GAME #1: RETRO ASTEROIDS (SPACE SHOOTER)
    // ==========================================
    const runSpaceShooter = () => {
      let shipX = canvas.width / 2;
      let shipY = canvas.height - 50;
      const shipSize = 16;
      const shipSpeed = 5.5;

      let bullets: Array<{ x: number; y: number; vy: number }> = [];
      let asteroids: Array<{ x: number; y: number; radius: number; speed: number; angle: number; rotationSpeed: number }> = [];
      let lastShotTime = 0;

      const keysPressed = controlsRef.current;

      setScore(0);
      setGameOver(false);

      const loop = () => {
        ctx.fillStyle = "#0c0d11";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid lines back
        ctx.strokeStyle = "rgba(34, 197, 94, 0.03)";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 30) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        // Draw HUD score inside canvas
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`SCORE: ${latestScore.current}`, 20, 30);
        ctx.fillText(`HUD SPACE`, canvas.width - 100, 30);

        // Control ship movement
        if (keysPressed.left) shipX = Math.max(20, shipX - shipSpeed);
        if (keysPressed.right) shipX = Math.min(canvas.width - 20, shipX + shipSpeed);

        // Fire rate cap
        if (keysPressed.space) {
          const now = Date.now();
          if (now - lastShotTime > 250) {
            bullets.push({ x: shipX, y: shipY - 10, vy: -7 });
            lastShotTime = now;
            if (soundEnabled) playRetroSound("laser");
          }
        }

        // Draw Player Ship (Glow dynamic triangle)
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.moveTo(shipX, shipY - 16);
        ctx.lineTo(shipX - 12, shipY + 10);
        ctx.lineTo(shipX + 12, shipY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0; // reset

        // Draw Ship Thruster
        ctx.fillStyle = Math.random() > 0.5 ? "#f97316" : "#ef4444";
        ctx.beginPath();
        ctx.moveTo(shipX - 4, shipY + 10);
        ctx.lineTo(shipX + 4, shipY + 10);
        ctx.lineTo(shipX, shipY + 18 + Math.random() * 5);
        ctx.closePath();
        ctx.fill();

        // Spawn Asteroids
        if (Math.random() < 0.02 + latestScore.current * 0.0005) {
          asteroids.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -20,
            radius: Math.random() * 16 + 10,
            speed: Math.random() * 2 + 1.5 + latestScore.current * 0.02,
            angle: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.04,
          });
        }

        // Move & Draw Bullets
        bullets.forEach((b, bulletIdx) => {
          b.y += b.vy;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 4;
          ctx.fillRect(b.x - 2, b.y, 4, 10);
          ctx.shadowBlur = 0;

          // Out of screen filter
          if (b.y < -10) bullets.splice(bulletIdx, 1);
        });

        // Move & Draw Asteroids
        asteroids.forEach((ast, astIdx) => {
          ast.y += ast.speed;
          ast.angle += ast.rotationSpeed;

          // Draw Asteroid
          ctx.fillStyle = "#3f3f46";
          ctx.strokeStyle = "#a1a1aa";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const points = 8;
          for (let i = 0; i < points; i++) {
            const angleOffset = (i * Math.PI * 2) / points;
            const r = ast.radius + (Math.sin(angleOffset * 3) * ast.radius * 0.2);
            const px = ast.x + Math.cos(ast.angle + angleOffset) * r;
            const py = ast.y + Math.sin(ast.angle + angleOffset) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Check Bullet collision
          bullets.forEach((b, bIdx) => {
            const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
            if (dist < ast.radius + 6) {
              bullets.splice(bIdx, 1);
              const earnedPoints = Math.round(ast.radius);
              setScore((prev) => prev + earnedPoints);
              createExplosion(ast.x, ast.y, "#f43f5e");
              if (soundEnabled) playRetroSound("hit");
              asteroids.splice(astIdx, 1);
            }
          });

          // Check Player collision
          const colDist = Math.hypot(shipX - ast.x, shipY - ast.y);
          if (colDist < ast.radius + 10) {
            setGameOver(true);
            createExplosion(shipX, shipY, "#ef4444");
            if (soundEnabled) playRetroSound("hit");
          }

          // Offscreen filter
          if (ast.y > canvas.height + 40) {
            asteroids.splice(astIdx, 1);
          }
        });

        updateParticles();
        drawParticles();

        if (latestScore.current >= 1200) {
          // Hard mode flash
          ctx.fillStyle = "rgba(34,197,94,0.02)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        if (!latestScore.current && gameOver) {
          // Avoid glitch
        }

        if (latestScore.current && gameOver) {
          // Terminate
          cancelAnimationFrame(animId);
        } else {
          animId = requestAnimationFrame(loop);
        }
      };

      loop();
    };

    // ==========================================
    // GAME #2: CYBER RUNNER (NEON SKY JUMPER)
    // ==========================================
    const runCyberRunner = () => {
      let runnerY = canvas.height - 70;
      let runnerHeight = 24;
      let runnerWidth = 18;
      let vy = 0;
      const gravity = 0.5;
      let isGrounded = true;

      let obstacles: Array<{ x: number; y: number; w: number; h: number; speed: number }> = [];
      const floorY = canvas.height - 50;

      const keysPressed = controlsRef.current;
      setScore(0);
      setGameOver(false);

      const loop = () => {
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ground visual neon line
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(canvas.width, floorY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Custom floor retro lines
        ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, floorY);
          ctx.lineTo(i - 40, canvas.height);
          ctx.stroke();
        }

        // Score display
        ctx.fillStyle = "#3b82f6";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`SCORE: ${latestScore.current}`, 20, 30);
        ctx.fillText(`NEON JUMPER`, canvas.width - 120, 30);

        // Jump physics
        if ((keysPressed.space || keysPressed.left || keysPressed.right) && isGrounded) {
          vy = -10.5;
          isGrounded = false;
          if (soundEnabled) playRetroSound("jump");
          // Clear keys to avoid auto repeat
          keysPressed.space = false;
          keysPressed.left = false;
          keysPressed.right = false;
        }

        vy += gravity;
        runnerY += vy;

        if (runnerY >= floorY - runnerHeight) {
          runnerY = floorY - runnerHeight;
          vy = 0;
          isGrounded = true;
        }

        // Draw Player Runner (Yellow glowing square block)
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#facc15";
        ctx.fillRect(80, runnerY, runnerWidth, runnerHeight);
        ctx.shadowBlur = 0;

        // Spawn Radioactive blue obstacles
        if (Math.random() < 0.015 + latestScore.current * 0.0003) {
          const obstacleHeight = Math.random() * 20 + 20;
          const obstacleWidth = 16;
          // Ensure min space between obstacles
          if (obstacles.length === 0 || (canvas.width - obstacles[obstacles.length - 1].x > 180)) {
            obstacles.push({
              x: canvas.width + 10,
              y: floorY - obstacleHeight,
              w: obstacleWidth,
              h: obstacleHeight,
              speed: 4.5 + latestScore.current * 0.01,
            });
          }
        }

        // Move and draw obstacles
        obstacles.forEach((obs, obsIdx) => {
          obs.x -= obs.speed;

          // Draw Obstacle (Hot Neon Coral alert color)
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.shadowBlur = 0;

          // Check Collision with player (located at x: 80, y: runnerY)
          const rx = 80;
          if (
            rx < obs.x + obs.w &&
            rx + runnerWidth > obs.x &&
            runnerY < obs.y + obs.h &&
            runnerY + runnerHeight > obs.y
          ) {
            setGameOver(true);
            createExplosion(rx + runnerWidth / 2, runnerY + runnerHeight / 2, "#ef4444");
            if (soundEnabled) playRetroSound("hit");
          }

          // Dodge points
          if (obs.x < 80 && ! ( (obs as any).alreadyScored ) ) {
            (obs as any).alreadyScored = true;
            setScore((prev) => prev + 50);
            createExplosion(obs.x + 8, obs.y, "#3b82f6");
            if (soundEnabled) playRetroSound("brick");
          }

          // Offscreen check
          if (obs.x < -40) {
            obstacles.splice(obsIdx, 1);
          }
        });

        updateParticles();
        drawParticles();

        if (gameOver) {
          cancelAnimationFrame(animId);
        } else {
          animId = requestAnimationFrame(loop);
        }
      };

      loop();
    };

    // ==========================================
    // GAME #3: NEON BRICK BREAKER (BREAKOUT)
    // ==========================================
    const runBrickBreaker = () => {
      let paddleWidth = 80;
      let paddleHeight = 12;
      let paddleX = (canvas.width - paddleWidth) / 2;
      const paddleY = canvas.height - 40;

      let ballX = canvas.width / 2;
      let ballY = canvas.height - 100;
      let ballSpeedX = 3.5;
      let ballSpeedY = -4;
      const ballRadius = 6;

      interface Brick {
        x: number;
        y: number;
        width: number;
        height: number;
        color: string;
        points: number;
        active: boolean;
      }

      let bricks: Brick[] = [];
      const brickRows = 4;
      const brickCols = 8;
      const brickWidth = 60;
      const brickHeight = 15;
      const brickGap = 8;
      const startX = (canvas.width - (brickCols * brickWidth + (brickCols - 1) * brickGap)) / 2;
      const startY = 60;

      const colors = ["#ef4444", "#fb923c", "#facc15", "#4ade80"];

      const initBricks = () => {
        bricks = [];
        for (let r = 0; r < brickRows; r++) {
          for (let c = 0; c < brickCols; c++) {
            bricks.push({
              x: startX + c * (brickWidth + brickGap),
              y: startY + r * (brickHeight + brickGap),
              width: brickWidth,
              height: brickHeight,
              color: colors[r % colors.length],
              points: (brickRows - r) * 20,
              active: true,
            });
          }
        }
      };

      initBricks();
      setScore(0);
      setGameOver(false);

      const keysPressed = controlsRef.current;

      // Mouse control support inside canvas
      const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const rootX = e.clientX - rect.left;
        const normalizedX = (rootX / rect.width) * canvas.width;
        paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, normalizedX - paddleWidth / 2));
      };
      canvas.addEventListener("mousemove", handleMouseMove);

      const loop = () => {
        ctx.fillStyle = "#090c0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Core grid lines
        ctx.strokeStyle = "rgba(168, 85, 247, 0.03)";
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }

        // Draw HUD score inside canvas
        ctx.fillStyle = "#a855f7";
        ctx.font = "bold 14px monospace";
        ctx.fillText(`SCORE: ${latestScore.current}`, 20, 30);
        ctx.fillText(`BRICK BREAKER`, canvas.width - 130, 30);

        // Keyboard Paddle Control
        const paddleSpeed = 7;
        if (keysPressed.left) {
          paddleX = Math.max(0, paddleX - paddleSpeed);
        }
        if (keysPressed.right) {
          paddleX = Math.min(canvas.width - paddleWidth, paddleX + paddleSpeed);
        }

        // Draw Glow Paddle
        ctx.shadowColor = "#a855f7";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "#c084fc";
        ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
        ctx.shadowBlur = 0;

        // Move Ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Bounce left/right walls
        if (ballX + ballRadius >= canvas.width || ballX - ballRadius <= 0) {
          ballSpeedX *= -1;
          if (soundEnabled) playRetroSound("brick");
        }

        // Bounce top ceiling
        if (ballY - ballRadius <= 0) {
          ballSpeedY *= -1;
          if (soundEnabled) playRetroSound("brick");
        }

        // Bottom loss check
        if (ballY - ballRadius > canvas.height) {
          setGameOver(true);
          if (soundEnabled) playRetroSound("hit");
        }

        // Bounce off paddle
        if (
          ballY + ballRadius >= paddleY &&
          ballY - ballRadius <= paddleY + paddleHeight &&
          ballX >= paddleX &&
          ballX <= paddleX + paddleWidth
        ) {
          ballSpeedY = -Math.abs(ballSpeedY);
          // Angle depends on where ball hits the paddle
          const hitPos = (ballX - paddleX) / paddleWidth;
          ballSpeedX = (hitPos - 0.5) * 8;
          if (soundEnabled) playRetroSound("jump");
        }

        // Bounce off active bricks
        let activeBricksLeft = 0;
        bricks.forEach((brick) => {
          if (!brick.active) return;
          activeBricksLeft++;

          if (
            ballX + ballRadius >= brick.x &&
            ballX - ballRadius <= brick.x + brick.width &&
            ballY + ballRadius >= brick.y &&
            ballY - ballRadius <= brick.y + brick.height
          ) {
            brick.active = false;
            ballSpeedY *= -1;
            setScore((prev) => prev + brick.points);
            createExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
            if (soundEnabled) playRetroSound("brick");
          }
        });

        // Trigger reset level if all bricks clear
        if (activeBricksLeft === 0) {
          initBricks();
          ballX = canvas.width / 2;
          ballY = canvas.height - 100;
          ballSpeedX = 4;
          ballSpeedY = -4.5;
        }

        // Draw Bricks with colors
        bricks.forEach((brick) => {
          if (!brick.active) return;
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          // border highlight
          ctx.strokeStyle = "rgba(0,0,0,0.3)";
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        });

        // Draw Ball (Glow yellow-green circle)
        ctx.beginPath();
        ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.shadowBlur = 0;

        updateParticles();
        drawParticles();

        if (gameOver) {
          canvas.removeEventListener("mousemove", handleMouseMove);
          cancelAnimationFrame(animId);
        } else {
          animId = requestAnimationFrame(loop);
        }
      };

      loop();

      return () => {
        canvas.removeEventListener("mousemove", handleMouseMove);
      };
    };

    // Choose target game
    let cleanUpFn: (() => void) | undefined;
    if (game.id === "retro-asteroids") {
      runSpaceShooter();
    } else if (game.id === "cyber-runner") {
      runCyberRunner();
    } else if (game.id === "neon-brick-breaker") {
      cleanUpFn = runBrickBreaker();
    }

    // Key event bindings
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") controlsRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") controlsRef.current.right = true;
      if (e.key === " " || e.key === "ArrowUp") {
        controlsRef.current.space = true;
        // prevent page scrolling down
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") controlsRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") controlsRef.current.right = false;
      if (e.key === " " || e.key === "ArrowUp") controlsRef.current.space = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (cleanUpFn) cleanUpFn();
      cancelAnimationFrame(animId);
    };
  }, [game, soundEnabled]);

  // Submit high score to server API
  const handleSavePoints = async () => {
    if (activeScoreSent) return;
    setLoadingRecord(true);
    setFeedbackMsg("");

    try {
      const response = await fetch("/api/jogos/pontuar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, score }),
      });

      const data = await response.json();
      if (!response.ok) {
        setFeedbackMsg(data.error || "Houve um erro ao enviar sua pontuação.");
        return;
      }

      onPointsRecorded(data.creditsEarned, data.credits, data.message);
      setActiveScoreSent(true);
      if (soundEnabled) playRetroSound("success");
      setFeedbackMsg(`Sincronizado! Ganhou +${data.creditsEarned} créditos virtuais.`);
    } catch (err) {
      console.error(err);
      setFeedbackMsg("Falhou ao conectar com o servidor.");
    } finally {
      setLoadingRecord(false);
    }
  };

  // On-screen simulated controller press details (friendly for mobile/touch)
  const setControlLeft = (active: boolean) => {
    controlsRef.current.left = active;
  };
  const setControlRight = (active: boolean) => {
    controlsRef.current.right = active;
  };
  const triggerControlSpace = () => {
    controlsRef.current.space = true;
    setTimeout(() => {
      controlsRef.current.space = false;
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#0b0c0e] border border-gray-800 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0,255,65,0.15)] flex flex-col">
        
        {/* Header toolbar */}
        <div className="bg-[#121418] px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2 select-none">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-[#1c1f26] border border-gray-820 text-[#00ff41]">
              <Gamepad2 size={16} />
            </span>
            <div>
              <h2 className="text-xs font-black italic uppercase text-white leading-none tracking-tight">
                JOGANDO: {game.title}
              </h2>
              <span className="text-[10px] text-gray-500 font-mono">by {game.developer}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Desativar Áudio" : "Ativar Áudio"}
              className="text-gray-400 hover:text-white p-1.5 rounded bg-[#1c1f26] border border-gray-800 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Back to lobby */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-[10px] font-mono px-3 py-1.5 bg-red-950/20 border border-red-900/50 text-red-400 rounded hover:bg-[#ff3131] hover:text-black hover:font-bold transition-all cursor-pointer"
            >
              <X size={12} />
              <span>Sair da Partida</span>
            </button>
          </div>
        </div>

        {/* Game play area context */}
        <div className="p-4 bg-[#0b0c0e] flex flex-col items-center justify-center relative w-full">
          {isCasinoGame ? (
            <div className="w-full max-w-[600px] border border-gray-800 bg-[#0c0d11] rounded-xl p-4 md:p-6 shadow-2xl relative min-h-[460px] flex flex-col justify-between">
              {gameOver ? (
                <div className="flex flex-col items-center justify-center p-6 text-center select-none grow">
                  <div className="h-14 w-14 rounded-xl bg-red-950/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                    <Trophy size={28} />
                  </div>
                  <span className="font-mono text-xs tracking-widest text-[#ff3131] uppercase font-bold">FICHAS ZERADAS</span>
                  <h3 className="text-2xl font-black italic text-white uppercase mt-1">GAME OVER</h3>
                  <p className="text-xs text-gray-500 max-w-xs mt-2 leading-relaxed">Você gastou todas as fichas nesta mesa de cassino. Entre novamente na partida pelo Lobby para simular mais jogadas!</p>
                  <button
                    onClick={() => {
                      setScore(user?.credits ?? 1000);
                      onUpdateCredits(user?.credits ?? 1000);
                      setGameOver(false);
                      setActiveScoreSent(false);
                      setFeedbackMsg("");
                    }}
                    className="mt-6 flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#00ff41] text-black text-xs font-bold uppercase rounded hover:scale-105 transition cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Recarregar Saldo</span>
                  </button>
                </div>
              ) : (
                <CasinoGames
                  gameId={game.id}
                  initialChips={score}
                  onScoreUpdate={(newScore) => {
                    setScore(newScore);
                    onUpdateCredits(newScore);
                  }}
                  onGameOverSignal={(finalScore) => {
                    setScore(finalScore);
                    onUpdateCredits(finalScore);
                    setGameOver(true);
                  }}
                  soundEnabled={soundEnabled}
                />
              )}

              {/* Action buttons footer inside card */}
              {!gameOver && (
                <div className="flex flex-col sm:flex-row gap-3.5 mt-5 border-t border-gray-800/80 pt-4 items-center justify-between">
                  <div className="text-left">
                    <p className="text-[9px] text-[#00ff41] font-mono tracking-tighter uppercase font-bold">★ SALDO SINCRONIZADO ★</p>
                    <p className="text-xs text-gray-400 font-mono">Saldo em Conta: <strong className="text-[#00ff41] font-mono">R$ {score.toLocaleString("pt-BR")},00</strong></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-zinc-900 border border-gray-800 text-zinc-300 text-xs font-bold uppercase rounded hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} /> 
                      <span>Sair da Mesa</span>
                    </button>
                  </div>
                </div>
              )}

              {feedbackMsg && (
                <p className="text-xs text-[#00ff41] mt-4 font-mono text-center bg-emerald-950/20 px-4 py-1.5 rounded border border-emerald-990/40">
                  {feedbackMsg}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Main interactive HTML5 Canvas */}
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-[#0c0d11] shadow-2xl w-full max-w-[600px] aspect-[3/2]">
                <canvas ref={canvasRef} className="w-full h-full block" />

                {/* Game Over Screen Overlay inside canvas box */}
                {gameOver && (
                  <div className="absolute inset-0 bg-[#090b0e]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="h-12 w-12 rounded-xl bg-[#ff3131]/10 border border-[#ff3131]/40 flex items-center justify-center text-[#ff3131] mb-3 animate-bounce">
                      <Trophy size={24} />
                    </div>
                    
                    <span className="font-mono text-[10px] tracking-widest text-[#00ff41] uppercase font-bold">
                      PARTIDA ENCERRADA
                    </span>
                    <h3 className="text-2xl font-black italic text-white uppercase mt-1">
                      VOCÊ MORREU!
                    </h3>
                    
                    <div className="mt-4 bg-[#121418] border border-gray-800 rounded-xl py-3 px-8 mb-5 select-none">
                      <p className="text-[10px] text-gray-500 uppercase font-mono">Pontuação Final</p>
                      <p className="text-3xl font-black text-white mt-1 font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-[#00ff41]">
                        {score} pts
                      </p>
                      <p className="text-[10px] text-[#00ff41] font-mono mt-1 font-bold">
                        Equivale a +R$ {Math.max(10, Math.floor(score / 10))},00 de Retorno
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Restart button */}
                      <button
                        onClick={() => {
                          setScore(0);
                          setGameOver(false);
                          setActiveScoreSent(false);
                          setFeedbackMsg("");
                        }}
                        className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#1c1f26] border border-gray-700 text-white text-xs font-bold uppercase rounded hover:bg-zinc-700 transition cursor-pointer"
                      >
                        <RefreshCw size={13} />
                        <span>Jogar Novamente</span>
                      </button>

                      {/* Save credits */}
                      <button
                        onClick={handleSavePoints}
                        disabled={activeScoreSent || loadingRecord}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00ff41] text-black text-xs font-black uppercase rounded shadow-[0_0_15px_rgba(0,255,65,0.3)] disabled:opacity-50 transition cursor-pointer"
                      >
                        <ShieldCheck size={14} />
                        <span>{loadingRecord ? "SALVANDO..." : activeScoreSent ? "CONVERSÃO SUCESSO!" : "FUTURAR & SACAR R$"}</span>
                      </button>
                    </div>

                    {feedbackMsg && (
                      <p className="text-xs text-[#00ff41] mt-4 font-mono bg-emerald-950/20 px-4 py-1 rounded border border-emerald-990/40">
                        {feedbackMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Simulated Screen Controller Buttons for mobile layout */}
              <div className="mt-4 w-full max-w-[600px] bg-[#121418] border border-gray-800 p-3 rounded-xl flex items-center justify-between select-none">
                <div className="flex gap-2">
                  <button
                    onMouseDown={() => setControlLeft(true)}
                    onMouseUp={() => setControlLeft(false)}
                    onTouchStart={() => setControlLeft(true)}
                    onTouchEnd={() => setControlLeft(false)}
                    className="h-12 w-12 flex items-center justify-center bg-[#1c1f26] border border-gray-800 rounded active:bg-[#ff3131] active:text-black select-none text-white touch-none cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    onMouseDown={() => setControlRight(true)}
                    onMouseUp={() => setControlRight(false)}
                    onTouchStart={() => setControlRight(true)}
                    onTouchEnd={() => setControlRight(false)}
                    className="h-12 w-12 flex items-center justify-center bg-[#1c1f26] border border-gray-800 rounded active:bg-[#ff3131] active:text-black select-none text-white touch-none cursor-pointer"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>

                <div className="text-gray-505 text-[10px] text-center font-mono uppercase hidden sm:block">
                  ⌨ Setas Esq/Dir para Mover • Barra de Espaço para Atirar ou Pular
                </div>

                <button
                  onClick={triggerControlSpace}
                  className="px-6 h-12 flex items-center justify-center bg-[#1c1f26] border border-[#00ff41]/40 text-[#00ff41] font-black text-xs uppercase tracking-wider rounded active:bg-[#00ff41] active:text-black select-none touch-none cursor-pointer"
                >
                  AÇÃO / ATIRAR
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer hints */}
        <div className="bg-[#121418] border-t border-gray-800 px-4 py-3 flex flex-col sm:flex-row justify-between text-gray-500 text-[10px] font-mono uppercase items-center gap-2 select-none font-bold">
          <span>Acesso à Mesa: {isCasinoGame ? "LIVRE (SEM TAXA DE ADMISSÃO)" : "LIVRE"}</span>
          <span className="text-[#00ff41]">★ SALDO REAL DE OPERAÇÃO ATIVO NO CASSINO XDOG ★</span>
        </div>

      </div>
    </div>
  );
}
