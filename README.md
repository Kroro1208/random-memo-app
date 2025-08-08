# Random Memo App

A desktop sticky notes application with drag & drop functionality, built with Electron, React 19, and TypeScript.

## Features

- 📝 Create and edit memos anywhere on your desktop
- 🎯 Drag & drop to organize memos freely
- 🎨 Customizable colors, fonts, and transparency
- 🔥 Global hotkeys for instant access
- 💾 Local SQLite database for data persistence
- 🌙 Dark mode support
- ⚡ Lightning-fast performance with React 19

## Tech Stack

- **Framework**: Electron 28+
- **Frontend**: React 19 + TypeScript 5.3+
- **Build Tool**: Vite 5
- **Database**: SQLite + Prisma ORM
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **Animation**: Framer Motion

## Development

### Prerequisites

- Node.js 20.x LTS or higher
- npm 10.x or higher

### Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run dist` - Create distributable packages
- `npm run test` - Run tests
- `npm run lint` - Check code quality
- `npm run format` - Format code with Prettier

### Building for Distribution

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── database/   # Database operations
│   ├── ipc/        # IPC handlers
│   ├── services/   # Business logic
│   ├── system/     # OS integration
│   └── window/     # Window management
├── renderer/       # React frontend
│   ├── components/ # React components
│   ├── hooks/      # Custom hooks
│   ├── stores/     # State management
│   └── styles/     # Styling
├── preload/        # Preload scripts
└── shared/         # Shared types/constants
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.