# VC Shop - Frontend Setup Guide

## Prerequisites

- Node.js (version 18 or higher)
- npm (version 9 or higher)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd a-vc-shop-launch/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment files:
   Copy `.env.example` to create your environment files:
   ```bash
   cp .env.example .env.development
   ```

   Update the environment variables as needed:
   ```
   VITE_API_URL=http://localhost:8000
   ```

## Development

To start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000

## Testing

Run tests:
```bash
npm test
```

Watch mode for tests:
```bash
npm run test:watch
```

## Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Code Quality

Lint your code:
```bash
npm run lint
```

Format your code:
```bash
npm run format
```

## Project Structure

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── assets/                 # Images, fonts, other static assets
│   ├── components/            
│   │   ├── common/            # Generic components
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific components
│   ├── pages/                 # Page components
│   ├── context/               # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API service functions
│   └── utils/                 # Helper functions
└── tests/                     # Test files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Health Checks

The application includes health checks for:
- Frontend server (http://localhost:5000/health)
- API connection (http://localhost:8000/health)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000 |

## Browser Support

The application is tested and supported on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)