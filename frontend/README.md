# VC Shop Frontend

A modern React-based e-commerce frontend application built with Vite and Tailwind CSS.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Jest + React Testing Library
- ESLint + Prettier

## Prerequisites

- Node.js >= 18
- npm >= 9

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/toloka-partners/a-vc-shop-launch.git
cd a-vc-shop-launch/frontend
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── layout/         # Layout components
│   │   └── features/       # Feature-specific components
│   ├── pages/              # Page components
│   ├── context/            # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── __tests__/         # Test files
│   └── utils/             # Helper functions
```

## Features

- Authentication (Login/Signup)
- Product Catalog
- Shopping Cart
- Checkout Process
- Order Management
- Protected Routes

## Routes

### Public Routes
- `/` - Home
- `/login` - User Login
- `/signup` - User Registration
- `/catalog` - Product Catalog
- `/products/:id` - Product Details

### Protected Routes
- `/cart` - Shopping Cart
- `/checkout` - Checkout
- `/orders` - Order History

## Testing

The project uses Jest and React Testing Library for testing. Tests are co-located with their respective components in the `__tests__` directory.

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Environment Variables

Copy `.env.example` to `.env.development` for development:

```
VITE_PORT=5000
VITE_API_URL=http://localhost:8000
```

## Code Quality

- ESLint for code linting
- Prettier for code formatting
- Pre-commit hooks for code quality checks

## Development Guidelines

1. Follow component structure in `src/components`
2. Write tests for new components
3. Use Tailwind CSS for styling
4. Follow ESLint and Prettier configurations

## Learn More

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
