# Open Bedwars

A TypeScript-based Minecraft datapack generator that produces a fully functional Bedwars game as a vanilla Minecraft datapack. Define currencies, item generators, and shops through a configuration-driven API, and the tool outputs ready-to-use `.mcfunction` files, scoreboards, and entities.

## Architecture

The project uses a **plugin system** built around lifecycle hooks. The core class `BedwarsDatapack` orchestrates datapack generation, while plugins like `BedwarsCore` implement game mechanics by hooking into `onLoad`, `onTick`, `onUnload`, and `onBuild` events.

```
src/
├── main.ts                  # Entry point - configures and builds the datapack
├── BedwarsDatapack.ts       # Core datapack builder and plugin manager
├── BedwarsPlugin.ts         # Abstract base class for plugins
├── plugins/
│   └── BedwarsCore/         # Main game logic plugin
│       ├── BedwarsCore.ts
│       └── types.ts
├── types/                   # Shared type definitions
└── utils/                   # Helpers (SNBT conversion, tick math, etc.)
```

## Features

- **Generators** — Configurable item spawners with custom intervals and positions
- **Shops** — Villager shopkeepers backed by minecart chests with full purchase/transaction logic
- **Currencies** — Multiple currency types with color-coded display names
- **Plugin system** — Extend the datapack with custom plugins via `BedwarsPlugin`

## Prerequisites

- [Bun](https://bun.sh/) 1.0+
- A Minecraft Java Edition world to output the datapack into

## Setup

```bash
bun install
```

## Usage

### Development (watch mode)

Watches `src/` for changes and re-executes automatically:

```bash
bun run dev
```

### One-time run

```bash
bun start
```

The generated datapack is written to the path configured in `src/main.ts`. Update the output path there to point to your Minecraft world's `datapacks/` folder.

### Lint & format

```bash
bun run check
```

## Configuration

Game behavior is defined in `src/main.ts` by configuring the `BedwarsCore` plugin:

```typescript
const datapack = new BedwarsDatapack("My Bedwars", "mybedwars");

const core = datapack.usePlugin(BedwarsCore);
core.configure({
  currencies: [
    { id: "minecraft:iron_ingot", name: "Iron", color: "gray" },
    { id: "minecraft:gold_ingot", name: "Gold", color: "yellow" },
  ],
  generators: [
    { item: "minecraft:iron_ingot", position: { x: 0, y: 64, z: 0 }, delaySeconds: 5 },
  ],
  shops: [
    {
      name: "Item Shop",
      items: [
        {
          id: "minecraft:wooden_sword",
          name: "Wooden Sword",
          count: 1,
          Slot: 0,
          price: { id: "minecraft:iron_ingot", count: 10 },
        },
      ],
      shopkeepers: [{ position: { x: 5, y: 64, z: 5 } }],
    },
  ],
});

datapack.build(buildPath);
```

## Writing a Plugin

Extend `BedwarsPlugin` and override any lifecycle hooks:

```typescript
import { BedwarsPlugin } from "../BedwarsPlugin";

export class MyPlugin extends BedwarsPlugin {
  onLoad(): string[] {
    return ["say MyPlugin loaded!"];
  }

  onTick(): string[] {
    return [];
  }
}
```

Register it on the datapack:

```typescript
datapack.usePlugin(MyPlugin);
```

## Tech Stack

- **TypeScript** — Source language
- **Bun** — Runtime and package manager
- **tsx** — TypeScript execution (used via Bun)
- **Biome** — Linter and formatter

## License

This project does not currently specify a license.
