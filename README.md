# Financial Dashboard

A React + TypeScript dashboard demonstrating performance optimization, data visualization, and clean component architecture.

## 🎯 Project Goals

This project showcases:

- **Data Visualization**: D3.js candlestick charts with real financial data
- **Component Architecture**: Reusable TypeScript components with clean APIs
- **Performance**: Optimized rendering for large datasets (1000+ data points)
- **Theming**: Light/dark mode using CSS variables
- **Modern Stack**: Vite, React 18, TypeScript with strict mode

## 🚀 Quick Start

The [public demo](https://nlevick.github.io/stock-dashboard/) uses a snapshot of
Alpha Vantage daily and weekly price history for SPY and IBIT through
November 20, 2026. The dashboard fetches the snapshot from GitHub Pages.

### Prerequisites

- Node.js 22.12+ or Node.js 20.19+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone [your-repo-url]
cd stock-dashboard

# Install dependencies
npm install

# Get a free API key from Alpha Vantage
# https://www.alphavantage.co/support/#api-key

# Set VITE_ALPHA_VANTAGE_KEY in .env.development.local for local API requests

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Deployment to GitHub Pages

The production build fetches the checked-in snapshot files from `public/data/`.

```bash
# Build and deploy
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/       # Reusable React components (Week 2-3)
├── services/         # API integration
├── types/            # TypeScript interfaces
├── styles/           # Theme and global styles
├── App.tsx          # Main application
└── main.tsx         # Entry point
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety with strict mode
- **Vite** - Build tool and dev server
- **D3.js** - Data visualization
- **CSS Variables** - Theming system

## 📊 Current Features

- ✅ Alpha Vantage API integration
- ✅ Light/dark theme toggle
- ✅ TypeScript strict mode
- 🚧 Candlestick chart (Week 2)
- 🚧 Component library (Week 2-3)
- 🚧 Performance optimizations (Week 3)

## 🗓️ Development Roadmap

### Week 1 (Complete)

- [x] Project setup with Vite + React + TypeScript
- [x] API integration with Alpha Vantage
- [x] Theme system with CSS variables
- [x] Basic data fetching and display

### Week 2 (Planned)

- [ ] D3.js candlestick chart component
- [ ] Data table component with sorting
- [ ] Stock symbol selector
- [ ] Theme toggle component

### Week 3 (Planned)

- [ ] Performance optimizations (memoization, virtualization)
- [ ] Polish and documentation
- [ ] Demo video

## 🎨 Component Design Philosophy

This project demonstrates production-ready component patterns:

- **Type Safety**: Strict TypeScript with no `any` types
- **Controlled/Uncontrolled APIs**: Components support both patterns
- **Composition**: Small, focused components that compose well
- **Accessibility**: Semantic HTML and keyboard navigation
- **Performance**: Optimized re-renders and large dataset handling

## 🔗 Links

- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)

## 📄 License

MIT
