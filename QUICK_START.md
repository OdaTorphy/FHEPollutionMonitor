# Quick Start Guide - Security & Performance Features

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Initialize Husky hooks
npm run prepare

# 3. Set up environment
cp .env.example .env

# 4. Edit .env with your settings
# Required: PRIVATE_KEY, SEPOLIA_RPC_URL, PAUSER_SET
```

## Daily Commands

### Development
```bash
npm run compile           # Compile contracts
npm test                  # Run tests
npm run lint              # Check all linting
npm run format            # Format all code
```

### Security & Performance
```bash
npm run test:gas          # Run tests with gas reporting
npm run coverage          # Generate coverage report
npm run security          # Run security audit
npm run size              # Check contract sizes
```

### Full CI Pipeline (Local)
```bash
npm run ci                # Run complete CI pipeline
```

## Git Workflow

### Automatic Checks

**On Commit** (pre-commit hook runs):
- ✅ Solidity linting
- ✅ JavaScript linting
- ✅ Code formatting check
- ✅ Unit tests

**On Push** (pre-push hook runs):
- ✅ Full test suite
- ✅ Gas reporting
- ✅ Security analysis

### Skip Hooks (Emergency Only)
```bash
git commit --no-verify    # Skip pre-commit
git push --no-verify      # Skip pre-push
```

## Configuration

### PauserSet Example (.env)
```bash
# Single pauser
PAUSER_SET=0x1234567890123456789012345678901234567890

# Multiple pausers (comma-separated)
PAUSER_SET=0x1234567890123456789012345678901234567890,0x2345678901234567890123456789012345678901
```

### Rate Limiting (DoS Protection)
```bash
MAX_REPORTS_PER_DAY=100
MIN_REPORT_INTERVAL=3600
```

## Troubleshooting

### Husky not working
```bash
rm -rf .husky
npm run prepare
```

### Linting errors
```bash
npm run lint:fix          # Auto-fix issues
```

### Formatting issues
```bash
npm run format            # Auto-format code
```

### Gas reporter not showing
```bash
REPORT_GAS=true npm test
```

## Documentation

- [SECURITY_PERFORMANCE.md](./SECURITY_PERFORMANCE.md) - Complete security & performance guide
- [TOOLCHAIN_INTEGRATION.md](./TOOLCHAIN_INTEGRATION.md) - Toolchain integration details
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation summary

## Key NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Lint Solidity + JavaScript |
| `npm run lint:fix` | Auto-fix all linting issues |
| `npm run format` | Format all code |
| `npm run format:check` | Check formatting |
| `npm test` | Run unit tests |
| `npm run test:gas` | Run tests with gas reporting |
| `npm run coverage` | Generate coverage report |
| `npm run security` | Run security audit |
| `npm run ci` | Run full CI pipeline |
| `npm run compile` | Compile contracts |
| `npm run size` | Check contract sizes |

## CI/CD

### Automated Checks (GitHub Actions)

**On every push/PR**:
- Linting (Solidity + JavaScript)
- Formatting validation
- Full test suite
- Coverage analysis
- Contract size check
- Dependency audit

**Daily (2 AM UTC)**:
- Complete security audit
- Performance testing
- Dependency vulnerability scan

## Support

- Issues: [GitHub Issues](../../issues)
- Documentation: See markdown files in project root
- Configuration: Check `.env.example` for all options

---

**Quick Reference** - For detailed documentation, see the comprehensive guides.
