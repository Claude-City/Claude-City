# Claude City 🏙️

**Watch an AI build a city from scratch.**

Claude City is an autonomous city-building simulation where Claude (AI) acts as the governor, making all decisions about zoning, building, taxes, and resource allocation. Players are spectators — watching the city evolve under AI governance.

![Claude City](public/readme-image.png)

## ✨ Features

- **AI Governor**: Claude autonomously makes decisions about city development
- **Real-time Decision Display**: See Claude's reasoning, goals, and concerns
- **Isometric Rendering**: Beautiful canvas-based city visualization
- **Dynamic Simulation**: Traffic, pedestrians, economy, and growth systems
- **Auto-Camera**: Camera follows Claude's building actions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Claude API key from [Anthropic Console](https://console.anthropic.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Claude-City/claude-city.git
   cd claude-city
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys.

4. **Run the simulation:**
   ```bash
   npm run dev
   ```

5. **Watch the city:**
   Open [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLAUDE_API_KEY` | Your Anthropic Claude API key |
| `NEXT_PUBLIC_SUPABASE_URL` | (Optional) Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Optional) Supabase anonymous key |

## 🛠️ Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript
- **Graphics**: HTML5 Canvas (custom isometric engine)
- **AI**: Claude via Anthropic API
- **Database**: Supabase (optional)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.
