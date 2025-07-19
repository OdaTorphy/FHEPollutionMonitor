# CI/CD Documentation

Complete Continuous Integration and Continuous Deployment documentation for Privacy Pollution Monitor.

## 📋 Overview

This project implements a comprehensive CI/CD pipeline using GitHub Actions with automated testing, code quality checks, security analysis, and coverage reporting.

## 🔄 CI/CD Pipeline Architecture

### Workflow Triggers

The CI/CD pipeline automatically runs on:
- **Push** to `main`, `develop`, or `master` branches
- **Pull Requests** to `main`, `develop`, or `master` branches
- **Manual** workflow dispatch (optional)

### Multi-Version Testing

Tests run on multiple Node.js versions:
- Node.js 18.x
- Node.js 20.x

This ensures compatibility across different Node.js LTS versions.

## 🛠️ Pipeline Jobs

### 1. Test Job

**Purpose**: Run comprehensive test suite and generate coverage reports

**Steps**:
1. Checkout code
2. Setup Node.js (matrix: 18.x, 20.x)
3. Install dependencies (`npm ci`)
4. Compile smart contracts
5. Run Solidity linter
6. Execute test suite
7. Generate coverage report
8. Upload coverage to Codecov
9. Archive test results

**Artifacts**:
- Test results for each Node.js version
- Coverage reports

### 2. Lint Job

**Purpose**: Code quality checks and static analysis

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Run Solhint (Solidity linter)
5. Check contract size

**Quality Checks**:
- Solidity code style
- Best practices
- Security patterns
- Contract size limits

### 3. Security Job

**Purpose**: Security analysis and vulnerability detection

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Run Slither analysis
5. Upload security findings to GitHub

**Security Tools**:
- Slither (static analysis)
- SARIF report generation
- GitHub Security tab integration

### 4. Gas Report Job

**Purpose**: Monitor gas usage and optimization

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Compile contracts
5. Run gas report
6. Archive gas usage data

**Gas Metrics**:
- Function-level gas usage
- Deployment costs
- Optimization opportunities

## 📁 Configuration Files

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop, master]
  pull_request:
    branches: [main, develop, master]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    # ... (see full file)
```

### Solhint Configuration

**File**: `.solhint.json`

```json
{
  "extends": "solhint:recommended",
  "rules": {
    "compiler-version": ["error", "^0.8.0"],
    "func-visibility": ["warn", { "ignoreConstructors": true }],
    "quotes": ["error", "double"],
    "max-line-length": ["warn", 120]
  }
}
```

**Features**:
- Extends recommended rules
- Custom rule configuration
- Compiler version enforcement
- Code style standards

### Codecov Configuration

**File**: `codecov.yml`

```yaml
codecov:
  require_ci_to_pass: yes

coverage:
  precision: 2
  range: "70...100"
  status:
    project:
      target: 80%
```

**Coverage Targets**:
- Project coverage: 80%
- Precision: 2 decimal places
- Threshold: 5% variance

### Prettier Configuration

**File**: `.prettierrc.json`

```json
{
  "printWidth": 120,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5"
}
```

**Formatting Rules**:
- 120 character line width
- 2-space indentation
- Semicolons required
- Double quotes for strings

## 🚀 npm Scripts

### Testing Scripts

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas

# Generate coverage report
npm run coverage

# Run tests on Sepolia testnet
npm run test:sepolia
```

### Code Quality Scripts

```bash
# Run Solidity linter
npm run lint:sol

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Check contract sizes
npm run size
```

### Development Scripts

```bash
# Compile contracts
npm run compile

# Start local node
npm run node

# Clean build artifacts
npm run clean

# Generate TypeChain types
npm run typechain
```

### Deployment Scripts

```bash
# Deploy to Sepolia
npm run deploy

# Deploy to local network
npm run deploy:local

# Verify on Etherscan
npm run verify

# Interact with contract
npm run interact

# Run simulation
npm run simulate
```

## 📊 Coverage Reporting

### Codecov Integration

**Setup**:
1. Create Codecov account at https://codecov.io
2. Add repository to Codecov
3. Add `CODECOV_TOKEN` to GitHub Secrets
4. Coverage automatically uploaded on each push

**Coverage Metrics**:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

**Reports Available**:
- GitHub PR comments
- Codecov dashboard
- Coverage badges
- Trend analysis

### Local Coverage

Generate coverage locally:

```bash
npm run coverage
```

**Output**:
- Terminal summary
- HTML report in `coverage/` directory
- JSON report for CI integration

**View HTML Report**:
```bash
open coverage/index.html
```

## 🔒 Security Analysis

### Slither Integration

**Automated Analysis**:
- Runs on every push and PR
- Detects common vulnerabilities
- Provides remediation suggestions
- Uploads findings to GitHub Security

**Security Checks**:
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Unprotected functions
- Gas optimization issues

**Manual Analysis**:
```bash
# Install Slither
pip3 install slither-analyzer

# Run Slither
slither contracts/
```

## 📈 GitHub Actions Status

### Status Badges

Add to README.md:

```markdown
![Test Suite](https://github.com/username/privacy-pollution-monitor/workflows/Test%20Suite/badge.svg)
![Coverage](https://codecov.io/gh/username/privacy-pollution-monitor/branch/main/graph/badge.svg)
```

### Viewing Results

**GitHub Actions**:
1. Navigate to repository
2. Click "Actions" tab
3. View workflow runs
4. Check job details

**Codecov Dashboard**:
1. Visit https://codecov.io
2. View coverage reports
3. Compare branches
4. Analyze trends

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/username/privacy-pollution-monitor.git

# Push code
git add .
git commit -m "Initial commit with CI/CD"
git push -u origin main
```

### 2. GitHub Secrets

Add the following secrets in GitHub repository settings:

**Required Secrets**:
- `CODECOV_TOKEN` - Codecov upload token
- `SEPOLIA_RPC_URL` - Sepolia RPC endpoint (for testnet tests)
- `PRIVATE_KEY` - Wallet private key (for deployment)
- `ETHERSCAN_API_KEY` - Etherscan API key (for verification)

**Add Secrets**:
1. Go to repository Settings
2. Navigate to Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret

### 3. Codecov Setup

**Steps**:
1. Visit https://codecov.io
2. Sign in with GitHub
3. Add repository
4. Copy upload token
5. Add token to GitHub Secrets as `CODECOV_TOKEN`

### 4. Enable GitHub Security Features

**Enable**:
1. Dependabot alerts
2. Code scanning
3. Secret scanning

**Navigate to**:
Settings > Security & analysis > Enable all features

## 🎯 Best Practices

### Commit Messages

Follow conventional commits:

```bash
feat: Add new monitoring station feature
fix: Resolve report verification issue
test: Add edge case tests
docs: Update CI/CD documentation
chore: Update dependencies
```

### Pull Request Workflow

1. Create feature branch
```bash
git checkout -b feature/new-feature
```

2. Make changes and commit
```bash
git add .
git commit -m "feat: Add new feature"
```

3. Push and create PR
```bash
git push origin feature/new-feature
```

4. Wait for CI checks to pass
5. Request review
6. Merge after approval

### Branch Protection Rules

**Recommended Settings**:
- Require pull request reviews (1-2 reviewers)
- Require status checks to pass
- Require branches to be up to date
- Include administrators

**Configure**:
Settings > Branches > Add rule

## 📝 Troubleshooting

### Common Issues

#### 1. Tests Failing in CI but Pass Locally

**Cause**: Environment differences

**Solution**:
```bash
# Use same Node.js version
nvm use 20

# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

#### 2. Coverage Upload Fails

**Cause**: Missing CODECOV_TOKEN

**Solution**:
1. Verify token in GitHub Secrets
2. Check Codecov configuration
3. Review workflow logs

#### 3. Linting Errors

**Cause**: Code style violations

**Solution**:
```bash
# Auto-fix issues
npm run lint:fix

# Check remaining issues
npm run lint:sol
```

#### 4. Security Scan Fails

**Cause**: Slither installation or analysis errors

**Solution**:
```bash
# Install Slither locally
pip3 install slither-analyzer

# Run analysis
slither contracts/ --print human-summary
```

## 📊 Monitoring and Metrics

### Key Metrics

**Track**:
- Test pass rate
- Code coverage percentage
- Build duration
- Deployment success rate
- Security findings

**Tools**:
- GitHub Actions insights
- Codecov dashboard
- Custom badges

### Performance Optimization

**Optimize CI/CD**:
- Use `npm ci` instead of `npm install`
- Cache `node_modules`
- Run jobs in parallel
- Use matrix strategy efficiently

## 🔄 Continuous Improvement

### Regular Updates

**Weekly**:
- Review security findings
- Check coverage trends
- Monitor gas usage

**Monthly**:
- Update dependencies
- Review workflow efficiency
- Optimize test suite

**Quarterly**:
- Audit security configuration
- Review branch protection
- Update documentation

## 📚 Additional Resources

### GitHub Actions
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

### Code Quality
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [Prettier Options](https://prettier.io/docs/en/options.html)

### Security
- [Slither Documentation](https://github.com/crytic/slither)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

### Coverage
- [Codecov Documentation](https://docs.codecov.com/)
- [Solidity Coverage](https://github.com/sc-forks/solidity-coverage)

## ✅ Checklist

Before going to production:

- [ ] All tests passing on multiple Node versions
- [ ] Coverage above 80%
- [ ] No security vulnerabilities
- [ ] All linting rules satisfied
- [ ] Gas usage optimized
- [ ] Documentation complete
- [ ] GitHub secrets configured
- [ ] Branch protection enabled
- [ ] CI/CD pipeline validated

---

**Last Updated**: 2024
**Pipeline Status**: Active
**Coverage Target**: 80%+
**Security**: Enabled
