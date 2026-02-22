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

### Prerequisites

- Node.js 18+
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

# Replace 'demo' in src/services/stockApi.ts with your API key

# Start development server
npm run dev
```

Visit `http://localhost:5173`

### Deployment to GitHub Pages

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

## 📝 Notes

- Alpha Vantage free tier: 25 API calls/day, 500 calls/minute
- Using 'demo' API key loads IBM stock data only
- For production use, get your own API key and add rate limiting

## 🔗 Links

- [Live Demo](#) (Coming soon)
- [Alpha Vantage API Docs](https://www.alphavantage.co/documentation/)

## 📄 License

MIT
