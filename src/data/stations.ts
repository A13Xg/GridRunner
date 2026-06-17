import type { Station } from "@/types";

export const STATIONS: Station[] = [
  {
    id: "command-core",
    name: "Command Core",
    shape: "octagon",
    color: 0x00ffff,
    colorHex: "#00ffff",
    position: { x: 400, y: 280 },
    size: 52,
  },
  {
    id: "planning-terminal",
    name: "Planning Terminal",
    shape: "rectangle",
    color: 0xff00ff,
    colorHex: "#ff00ff",
    position: { x: 180, y: 180 },
    size: 52,
  },
  {
    id: "data-nexus",
    name: "Data Nexus",
    shape: "hexagon",
    color: 0x00ff41,
    colorHex: "#00ff41",
    position: { x: 620, y: 180 },
    size: 52,
  },
  {
    id: "fabrication-bay",
    name: "Fabrication Bay",
    shape: "diamond",
    color: 0xff6600,
    colorHex: "#ff6600",
    position: { x: 180, y: 400 },
    size: 56,
  },
  {
    id: "qa-station",
    name: "QA Station",
    shape: "cross",
    color: 0xffff00,
    colorHex: "#ffff00",
    position: { x: 620, y: 400 },
    size: 52,
  },
];

export const getStation = (id: string) => STATIONS.find((s) => s.id === id);
