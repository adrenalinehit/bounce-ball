import { BlockType } from "../entities/Block.js";

export class LevelLoader {
  constructor() {
    // NOTE: richer levels come later; right now this is just a placeholder so Game can load.
    this.levels = [
      {
        name: "Intro",
        grid: [
          "..............",
          "....111111....",
          "....111111....",
          "....111111....",
          "..............",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
        },
      },
      {
        name: "Stagger",
        grid: [
          "..............",
          "..1111111111..",
          "...11111111...",
          "....111111....",
          "...11111111...",
          "..1111111111..",
          "..............",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
        },
      },
      {
        name: "Reinforced",
        grid: [
          "..............",
          "..2222222222..",
          "..2111111112..",
          "..2111111112..",
          "..2222222222..",
          "..............",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
          "2": { type: BlockType.strong, hp: 2 },
        },
      },
      {
        name: "Shield Wall",
        grid: [
          "..............",
          ".XXXXXXXXXXXX.",
          ".X1111111111X.",
          ".X1222222221X.",
          ".X1111111111X.",
          ".XXXXXEXXXXXX.",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
          "2": { type: BlockType.strong, hp: 3 },
          "X": { type: BlockType.unbreakable },
          "E": { type: BlockType.explosive },
        },
      },
      {
        name: "Zig Zag",
        grid: [
          "..............",
          "..1111111111..",
          "...211111112..",
          "....22111122..",
          "...211111112..",
          "..1111111111..",
          "..............",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
          "2": { type: BlockType.strong, hp: 2 },
        },
      },
      {
        name: "Detonators",
        grid: [
          "..............",
          "..1E11S11E11..",
          "..1111111111..",
          "..12E1111E21..",
          "..1111111111..",
          "..1E11S11E11..",
        ],
        legend: {
          ".": { type: "empty" },
          "1": { type: BlockType.normal },
          "2": { type: BlockType.strong, hp: 2 },
          "E": { type: BlockType.explosive },
          "S": { type: BlockType.splitter },
        },
      },
    ];
  }

  getLevel(index) {
    return this.levels[index % this.levels.length];
  }

  getLevelCount() {
    return this.levels.length;
  }
}


