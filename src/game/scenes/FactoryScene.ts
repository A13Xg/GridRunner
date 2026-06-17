import * as Phaser from "phaser";
import { STATIONS } from "@/data/stations";
import { INITIAL_AGENTS } from "@/data/agents";
import type { Agent, Station, Vec2 } from "@/types";

interface AgentSprites {
  body: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Graphics;
  progressBar: Phaser.GameObjects.Graphics;
  position: Vec2;
  tween: Phaser.Tweens.Tween | null;
}

export class FactoryScene extends Phaser.Scene {
  private agentSprites: Map<string, AgentSprites> = new Map();
  private stationGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private agentProgress: Map<string, number> = new Map();

  constructor() {
    super({ key: "FactoryScene" });
  }

  create() {
    this.drawGrid();
    this.drawFloor();
    STATIONS.forEach((s) => this.drawStation(s));
    INITIAL_AGENTS.forEach((a) => this.createAgentSprite(a));
    this.drawLegend();
    this.setupEventListeners();
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────

  private drawGrid() {
    this.gridGraphics = this.add.graphics();
    const g = this.gridGraphics;
    const { width, height } = this.scale;
    const step = 40;

    g.lineStyle(1, 0x0a0a2a, 0.8);
    for (let x = 0; x <= width; x += step) {
      g.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += step) {
      g.lineBetween(0, y, width, y);
    }

    // Corner brackets
    const bracketColor = 0x00ffff;
    const bSize = 20;
    g.lineStyle(2, bracketColor, 0.6);
    const corners = [
      [0, 0], [width, 0], [0, height], [width, height],
    ] as const;
    corners.forEach(([cx, cy]) => {
      const sx = cx === 0 ? 1 : -1;
      const sy = cy === 0 ? 1 : -1;
      g.lineBetween(cx, cy, cx + bSize * sx, cy);
      g.lineBetween(cx, cy, cx, cy + bSize * sy);
    });
  }

  private drawFloor() {
    const g = this.add.graphics();
    const { width, height } = this.scale;
    // Subtle floor zones
    g.fillStyle(0x050520, 0.6);
    g.fillRect(0, 0, width, height);
    // Center highlight
    g.fillStyle(0x080830, 0.4);
    g.fillRect(60, 60, width - 120, height - 120);
  }

  // ─── Stations ──────────────────────────────────────────────────────────────

  private drawStation(station: Station) {
    const g = this.add.graphics();
    const { x, y } = station.position;
    const s = station.size;
    const col = station.color;

    // Outer glow ring
    g.lineStyle(1, col, 0.2);
    g.strokeCircle(x, y, s + 18);
    g.lineStyle(1, col, 0.1);
    g.strokeCircle(x, y, s + 28);

    // Platform base
    g.fillStyle(0x0a0a20, 1);
    g.lineStyle(2, col, 0.8);

    switch (station.shape) {
      case "octagon":
        this.drawOctagon(g, x, y, s, col);
        break;
      case "hexagon":
        this.drawHexagonShape(g, x, y, s, col);
        break;
      case "diamond":
        this.drawDiamond(g, x, y, s, col);
        break;
      case "cross":
        this.drawCross(g, x, y, s, col);
        break;
      default:
        g.fillRect(x - s / 2, y - s / 2, s, s);
        g.strokeRect(x - s / 2, y - s / 2, s, s);
    }

    // Inner fill with tint
    g.fillStyle(col, 0.06);
    g.fillCircle(x, y, s * 0.6);

    // Corner markers
    g.fillStyle(col, 0.9);
    const dotRadius = 3;
    [
      { dx: -s / 2, dy: 0 },
      { dx: s / 2, dy: 0 },
      { dx: 0, dy: -s / 2 },
      { dx: 0, dy: s / 2 },
    ].forEach(({ dx, dy }) => g.fillCircle(x + dx, y + dy, dotRadius));

    // Station label
    this.add.text(x, y + s * 0.7 + 10, station.name.toUpperCase(), {
      fontSize: "9px",
      color: Phaser.Display.Color.IntegerToColor(col).rgba,
      fontFamily: "'Courier New', monospace",
      align: "center",
      letterSpacing: 2,
    }).setOrigin(0.5, 0);

    this.stationGraphics.set(station.id, g);

    // Pulse tween on station ring
    this.tweens.add({
      targets: g,
      alpha: { from: 0.85, to: 1 },
      duration: 2000 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private drawOctagon(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, col: number) {
    const pts = Array.from({ length: 8 }, (_, i) => ({
      x: x + r * Math.cos((Math.PI / 4) * i - Math.PI / 8),
      y: y + r * Math.sin((Math.PI / 4) * i - Math.PI / 8),
    }));
    g.fillStyle(0x0a0a20, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, col, 1);
    g.strokePoints(pts, true);
  }

  private drawHexagonShape(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, col: number) {
    const pts = Array.from({ length: 6 }, (_, i) => ({
      x: x + r * Math.cos((Math.PI / 3) * i - Math.PI / 6),
      y: y + r * Math.sin((Math.PI / 3) * i - Math.PI / 6),
    }));
    g.fillStyle(0x0a0a20, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, col, 1);
    g.strokePoints(pts, true);
  }

  private drawDiamond(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, col: number) {
    const pts = [
      { x, y: y - r },
      { x: x + r * 0.8, y },
      { x, y: y + r },
      { x: x - r * 0.8, y },
    ];
    g.fillStyle(0x0a0a20, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, col, 1);
    g.strokePoints(pts, true);
  }

  private drawCross(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, col: number) {
    const arm = r * 0.35;
    const pts = [
      { x: x - arm, y: y - r },
      { x: x + arm, y: y - r },
      { x: x + arm, y: y - arm },
      { x: x + r, y: y - arm },
      { x: x + r, y: y + arm },
      { x: x + arm, y: y + arm },
      { x: x + arm, y: y + r },
      { x: x - arm, y: y + r },
      { x: x - arm, y: y + arm },
      { x: x - r, y: y + arm },
      { x: x - r, y: y - arm },
      { x: x - arm, y: y - arm },
    ];
    g.fillStyle(0x0a0a20, 1);
    g.fillPoints(pts, true);
    g.lineStyle(2, col, 1);
    g.strokePoints(pts, true);
  }

  // ─── Agents ────────────────────────────────────────────────────────────────

  private createAgentSprite(agent: Agent) {
    const { x, y } = agent.position;
    const col = agent.color;
    const size = 14;

    // Outer ring (state indicator)
    const ring = this.add.graphics();
    ring.lineStyle(2, col, 0.5);
    ring.strokeCircle(x, y, size + 6);

    // Body
    const body = this.add.graphics();
    this.drawAgentShape(body, agent.shape, x, y, size, col, 1.0);

    // Progress bar (hidden initially)
    const progressBar = this.add.graphics();

    // Label
    const label = this.add.text(x, y + size + 8, agent.name.toUpperCase(), {
      fontSize: "8px",
      color: Phaser.Display.Color.IntegerToColor(col).rgba,
      fontFamily: "'Courier New', monospace",
      align: "center",
    }).setOrigin(0.5, 0);

    this.agentSprites.set(agent.id, {
      body,
      label,
      ring,
      progressBar,
      position: { ...agent.position },
      tween: null,
    });

    this.agentProgress.set(agent.id, 0);
  }

  private drawAgentShape(
    g: Phaser.GameObjects.Graphics,
    shape: Agent["shape"],
    x: number,
    y: number,
    size: number,
    col: number,
    alpha: number
  ) {
    g.clear();
    g.lineStyle(2, col, alpha);
    g.fillStyle(col, alpha * 0.3);

    switch (shape) {
      case "square":
        g.fillRect(x - size, y - size, size * 2, size * 2);
        g.strokeRect(x - size, y - size, size * 2, size * 2);
        break;
      case "circle":
        g.fillCircle(x, y, size);
        g.strokeCircle(x, y, size);
        break;
      case "triangle": {
        const h = size * 1.6;
        const pts = [
          { x, y: y - h * 0.65 },
          { x: x + size, y: y + h * 0.35 },
          { x: x - size, y: y + h * 0.35 },
        ];
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
        break;
      }
      case "hexagon": {
        const pts = Array.from({ length: 6 }, (_, i) => ({
          x: x + size * Math.cos((Math.PI / 3) * i - Math.PI / 6),
          y: y + size * Math.sin((Math.PI / 3) * i - Math.PI / 6),
        }));
        g.fillPoints(pts, true);
        g.strokePoints(pts, true);
        break;
      }
    }
  }

  // ─── Event Listeners ───────────────────────────────────────────────────────

  private setupEventListeners() {
    this.events.on("agent:move", this.handleAgentMove, this);
    this.events.on("task:progress", this.handleTaskProgress, this);
    this.events.on("sim:reset", this.handleReset, this);
  }

  private handleAgentMove({ agentId, target, duration }: { agentId: string; target: Vec2; duration: number }) {
    const sprite = this.agentSprites.get(agentId);
    if (!sprite) return;

    const agent = INITIAL_AGENTS.find((a) => a.id === agentId);
    if (!agent) return;

    // Cancel existing tween
    if (sprite.tween) sprite.tween.stop();

    const startX = sprite.position.x;
    const startY = sprite.position.y;

    // Animate ring to "moving" state
    sprite.ring.clear();
    sprite.ring.lineStyle(2, agent.color, 0.8);
    sprite.ring.strokeCircle(startX, startY, 22);

    // Motion trail effect via tweens on body/ring
    const progress = { t: 0 };
    const tween = this.tweens.add({
      targets: progress,
      t: 1,
      duration,
      ease: "Quad.easeInOut",
      onUpdate: () => {
        const px = Phaser.Math.Interpolation.Linear([startX, target.x], progress.t);
        const py = Phaser.Math.Interpolation.Linear([startY, target.y], progress.t);

        sprite.body.clear();
        this.drawAgentShape(sprite.body, agent.shape, px, py, 14, agent.color, 1.0);

        // Update ring position
        sprite.ring.clear();
        sprite.ring.lineStyle(2, agent.color, 0.6);
        sprite.ring.strokeCircle(px, py, 22);

        // Update label
        sprite.label.setPosition(px, py + 22);

        // Update progress bar position
        this.drawProgressBar(sprite.progressBar, px, py, this.agentProgress.get(agentId) ?? 0, agent.color);

        sprite.position = { x: px, y: py };
      },
      onComplete: () => {
        sprite.position = { x: target.x, y: target.y };
        // "Working" ring pulse
        this.tweens.add({
          targets: sprite.ring,
          alpha: { from: 0.3, to: 1 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      },
    });

    sprite.tween = tween;
  }

  private handleTaskProgress({ agentId, progress }: { agentId: string; progress: number }) {
    const sprite = this.agentSprites.get(agentId);
    if (!sprite) return;
    const agent = INITIAL_AGENTS.find((a) => a.id === agentId);
    if (!agent) return;

    this.agentProgress.set(agentId, progress);
    this.drawProgressBar(sprite.progressBar, sprite.position.x, sprite.position.y, progress, agent.color);
  }

  private drawProgressBar(g: Phaser.GameObjects.Graphics, x: number, y: number, progress: number, col: number) {
    g.clear();
    if (progress <= 0) return;
    const barW = 36;
    const barH = 4;
    const bx = x - barW / 2;
    const by = y - 28;

    g.fillStyle(0x111122, 1);
    g.fillRect(bx, by, barW, barH);

    g.fillStyle(col, 0.9);
    g.fillRect(bx, by, (barW * progress) / 100, barH);

    g.lineStyle(1, col, 0.4);
    g.strokeRect(bx, by, barW, barH);
  }

  private handleReset() {
    // Return all agents to initial positions
    INITIAL_AGENTS.forEach((agent) => {
      const sprite = this.agentSprites.get(agent.id);
      if (!sprite) return;

      if (sprite.tween) sprite.tween.stop();
      this.agentProgress.set(agent.id, 0);

      const { x, y } = agent.position;
      sprite.position = { x, y };

      sprite.body.clear();
      this.drawAgentShape(sprite.body, agent.shape, x, y, 14, agent.color, 1.0);

      sprite.ring.clear();
      sprite.ring.lineStyle(2, agent.color, 0.4);
      sprite.ring.strokeCircle(x, y, 22);

      sprite.label.setPosition(x, y + 22);
      sprite.progressBar.clear();

      // Kill any active tweens on ring
      this.tweens.killTweensOf(sprite.ring);
      sprite.ring.setAlpha(1);
    });
  }

  // ─── Legend ────────────────────────────────────────────────────────────────

  private drawLegend() {
    const { width } = this.scale;
    const x = width - 10;
    const startY = 10;
    const lineH = 16;

    const legend = [
      { label: "■ Planner", color: "#ff00ff" },
      { label: "● Researcher", color: "#00ff41" },
      { label: "▲ Builder", color: "#ff6600" },
      { label: "⬡ Reviewer", color: "#ffff00" },
    ];

    legend.forEach(({ label, color }, i) => {
      this.add.text(x, startY + i * lineH, label, {
        fontSize: "9px",
        color,
        fontFamily: "'Courier New', monospace",
        align: "right",
      }).setOrigin(1, 0);
    });
  }

  update() {
    // No per-frame logic needed — all movement is tween-driven
  }
}
