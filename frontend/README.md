# Calculator Frontend

A beautiful, modern calculator built with Next.js 14, TypeScript, Tailwind CSS, Zustand, and Framer Motion. Features a Claude-inspired theme with smooth animations and dark mode support.

## Features

- ✨ Modern, clean UI with Claude theme (coral/orange accents)
- 🌓 Dark mode support with smooth transitions
- ⌨️ Full keyboard support
- 📊 Calculation history (last 10 calculations)
- 🎭 Smooth animations using Framer Motion
- 📱 Responsive design (works on mobile and desktop)
- 🧮 Six math operations: +, -, ×, ÷, x², x³
- ⚡ Fast and lightweight state management with Zustand
- ✅ Comprehensive test coverage

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Framer Motion** - Smooth animations
- **Jest + React Testing Library** - Component testing

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the calculator.

### Building for Production

```bash
npm run build
npm start
```

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:ci
```

### Linting

```bash
npm run lint
```

## Keyboard Shortcuts

- **0-9** - Input digits
- **. (period)** - Decimal point
- **+ - * /** - Math operations
- **Enter or =** - Calculate result
- **Escape or C** - Clear calculator

## Project Structure

```
frontend/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Calculator.tsx     # Main calculator container
│   ├── Display.tsx        # Calculator display
│   ├── Button.tsx         # Reusable button component
│   ├── NumberPad.tsx      # Number pad (0-9, decimal)
│   ├── OperationButtons.tsx # Operation buttons
│   ├── History.tsx        # Calculation history
│   └── ThemeToggle.tsx    # Dark/light mode toggle
├── store/                 # Zustand stores
│   ├── calculatorStore.ts # Calculator state
│   └── themeStore.ts      # Theme state
├── lib/                   # Utility functions
│   └── math.ts            # Math operations
└── __tests__/             # Component tests
    ├── Button.test.tsx
    ├── Display.test.tsx
    ├── calculatorStore.test.ts
    └── math.test.ts
```

## Design - Claude Theme

The calculator uses an Anthropic/Claude-inspired color scheme:

### Light Mode
- Background: Warm cream (#E8DDD4)
- Primary: Claude coral (#D97757)
- Text: Dark stone (#292524)

### Dark Mode
- Background: Near-black (#1A1A1A)
- Primary: Claude coral (#D97757)
- Text: Off-white (#FAFAF9)

## Animations

The calculator features smooth animations powered by Framer Motion:

- **Button press**: Scale down effect with spring animation
- **Result display**: Slide and fade animation on value changes
- **History panel**: Stagger fade-in for history items
- **Theme toggle**: Smooth color transitions
- **Error handling**: Horizontal shake animation
- **Mount animation**: Subtle fade and scale up on load

## Math Operations

The calculator supports six operations:

1. **Addition (+)**: Adds two numbers
2. **Subtraction (-)**: Subtracts second number from first
3. **Multiplication (×)**: Multiplies two numbers
4. **Division (÷)**: Divides first number by second (with zero-division protection)
5. **Square (x²)**: Squares the current number
6. **Cube (x³)**: Cubes the current number

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is part of the agent-workflow-test repository.

## Contributing

This is a test project for AI agent workflows. See the main repository README for contribution guidelines.
