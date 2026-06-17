"use client";
import { useEffect, useRef } from "react";
import { useGameBridge } from "@/hooks/useGameBridge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGame = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyScene = any;

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<AnyGame>(null);
  const sceneRef = useRef<AnyScene>(null);

  useGameBridge(sceneRef);

  useEffect(() => {
    if (!containerRef.current) return;

    let game: AnyGame;

    async function initPhaser() {
      if (gameRef.current) return;

      const Phaser = await import("phaser");
      const { createGameConfig } = await import("@/game/GameConfig");

      const config = createGameConfig(containerRef.current!);
      game = new Phaser.Game(config);
      gameRef.current = game;

      game.events.once("ready", () => {
        const scene = game.scene.getScene("FactoryScene");
        if (scene) sceneRef.current = scene;
      });
    }

    initPhaser();

    return () => {
      if (game) game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "#050510" }}
      />

      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none z-20" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/40 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/40 pointer-events-none z-20" />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <span className="text-[9px] font-mono text-cyan-400/20 tracking-[8px] uppercase">
          NeuralFoundry Factory Floor v0.1
        </span>
      </div>
    </div>
  );
}
