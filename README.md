# Fundlock

A Stacks blockchain application for time-locked fund management with a Svelte frontend.

## Project Structure

```
fundlock/
├── contracts/          # Clarity smart contracts
├── tests/             # Contract unit tests
├── offchain/          # Svelte frontend application
├── deployments/       # Deployment configurations
└── settings/          # Network settings (Devnet, Testnet, Mainnet)
```

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) - Stacks smart contract development tool
- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) - Package manager

## Getting Started

### 1. Install Dependencies

Install dependencies for both the root project and the offchain application:

```bash
# Install root project dependencies (for testing)
pnpm install

# Install offchain dependencies
cd offchain
pnpm install
cd ..
```

### 2. Run the Onchain (Backend)

The onchain component runs the Stacks blockchain devnet with your smart contracts deployed.

**Start the Clarinet devnet:**

```bash
clarinet devnet start
```

This command will:

- Start a local Stacks blockchain devnet
- Deploy your smart contracts from the `contracts/` directory
- Expose blockchain APIs at `http://localhost:3999`
- Keep running in the foreground

**Important:** Keep this terminal window open. The devnet must be running before you start the offchain application.

### 3. Run the Offchain (Frontend)

Once the devnet is running, open a **new terminal window** and start the frontend application:

```bash
cd offchain
pnpm dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Development Workflow

### Running Tests

Test your Clarity smart contracts:

```bash
# Run tests once
pnpm test

# Run tests with coverage report
pnpm run test:report

# Watch mode (re-run tests on file changes)
pnpm run test:watch
```

### Check Contract Syntax

Validate your Clarity contracts without running tests:

```bash
clarinet check
```

### Building the Frontend

Build the offchain application for production:

```bash
cd offchain
pnpm build
```

Preview the production build:

```bash
cd offchain
pnpm preview
```

## Quick Start (TL;DR)

```bash
# Terminal 1 - Start the blockchain devnet
clarinet devnet start

# Terminal 2 - Start the frontend (in a new terminal)
cd offchain && pnpm dev
```

Then open your browser to `http://localhost:5173`

## Common Issues

### Devnet Not Starting

If `clarinet devnet start` fails:

```bash
# Check Clarinet installation
clarinet --version

# Try resetting the devnet
rm -rf .cache
clarinet devnet start
```

### Frontend Can't Connect to Blockchain

Make sure:

1. The devnet is running (`clarinet devnet start`)
2. The blockchain API is accessible at `http://localhost:3999`
3. Check the browser console for connection errors

## Network Configuration

- **Devnet**: Local development (default)

  - Blockchain API: `http://localhost:3999`
  - Settings: `settings/Devnet.toml`

- **Testnet**: Stacks testnet

  - Settings: `settings/Testnet.toml`

- **Mainnet**: Stacks mainnet
  - Settings: `settings/Mainnet.toml`

## Project Components

### Smart Contracts (`contracts/`)

Clarity smart contracts that implement the fundlock logic.

### Tests (`tests/`)

Vitest-based unit tests for smart contracts using Clarinet SDK.

### Frontend (`offchain/`)

SvelteKit application that interacts with the smart contracts:

- Wallet integration (Stacks wallet)
- Transaction management
- Contract interaction UI
- Real-time updates via WebSocket

## Learn More

- [Clarinet Documentation](https://docs.hiro.so/clarinet)
- [Clarity Language Reference](https://docs.stacks.co/clarity)
- [Stacks.js Documentation](https://stacks.js.org/)
- [SvelteKit Documentation](https://kit.svelte.dev/)

## License

ISC
