import * as Phaser from "phaser";
import { FactoryScene } from "./scenes/FactoryScene";

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 800,
    height: parent.clientHeight || 540,
    backgroundColor: "#050510",
    scene: [FactoryScene],
    render: {
      antialias: true,
      pixelArt: false,
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: { noAudio: true },
  };
}
