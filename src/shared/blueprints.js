export const playerBlueprint = {
  name: "player",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "", "O", "O", "O", "O", "", ""],
    ["", "O", "S", "S", "S", "S", "O", ""],
    ["O", "S", "S", "S", "S", "S", "S", "O"],
    ["O", "S", "O", "S", "S", "O", "S", "O"],
    ["O", "S", "S", "S", "S", "S", "S", "O"],
    ["", "O", "J", "J", "J", "J", "O", ""],
    ["", "J", "J", "", "", "J", "J", ""],
    ["E", "E", "", "", "", "", "E", "E"],
  ],
  colorMap: {
    O: "#101820",
    S: "#f5d76e",
    J: "#59c3c3",
    E: "#ff6f59",
  },
  pixelSize: 12,
};

export const shrineBlueprint = {
  name: "shrine",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "", "S", "S", "", ""],
    ["", "S", "G", "G", "S", ""],
    ["S", "G", "L", "L", "G", "S"],
    ["S", "G", "L", "L", "G", "S"],
    ["", "S", "G", "G", "S", ""],
    ["", "", "S", "S", "", ""],
  ],
  colorMap: {
    S: "#5c677d",
    G: "#d8dbe2",
    L: "#8ac926",
  },
  pixelSize: 10,
};

export const villagerBlueprint = {
  name: "villager",
  schemaVersion: 1,
  revision: 1,
  updatedAt: "2026-03-15T00:00:00.000Z",
  zone: "starter-plains",
  matrix: [
    ["", "H", "H", "H", "H", ""],
    ["H", "S", "S", "S", "S", "H"],
    ["H", "S", "E", "S", "E", "H"],
    ["H", "S", "S", "S", "S", "H"],
    ["", "C", "C", "C", "C", ""],
    ["", "C", "", "", "C", ""],
  ],
  colorMap: {
    H: "#22333b",
    S: "#f7d08a",
    E: "#2f6690",
    C: "#7a9e7e",
  },
  pixelSize: 10,
};
