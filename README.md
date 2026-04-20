# Worry Solver React App

> **Local setup:** copy `.env.example` to `.env.local` and fill in real values. Never commit secrets — `.gitignore` blocks `.env.local` and `*.local`.

A React conversion of the original "解忧杂货铺" (Worry-Solving Shop) web application. This application allows users to anonymously share their concerns and receive helpful responses from others, with access code-based authentication for checking replies.

## Features

- **Multilingual Support**: Switch between Chinese and English
- **Access Code System**: Secure access to your posts using unique access codes
- **Anonymous Sharing**: Share your concerns without revealing your identity
- **Responsive Design**: Works on mobile and desktop devices

## Demo Access Codes

The application comes with demo access codes for testing:

- `TSZT-VVSM-8F8Y`: A sample submission in Chinese about social anxiety
- `J23B-F42A-LCRZ`: A sample submission about academic stress

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm (v6.x or higher)

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd worry-solver
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open your browser and navigate to http://localhost:3000

## Available Scripts

In the project directory, you can run:

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects the create-react-app configuration

## Project Structure

```
worry-solver/
├── public/              # Static files
├── src/                 # Source code
│   ├── assets/          # CSS, images, etc.
│   │   ├── layout/      # Layout components
│   │   └── pages/       # Page components
│   ├── context/         # React context
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main app component
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- This project is a React conversion of the original HTML/CSS/JS implementation
- FontAwesome for the icons
- React Router for routing
- i18next for internationalization
