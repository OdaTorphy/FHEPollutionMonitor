# GitHub Actions Setup Guide

Complete guide to set up and use the CI/CD pipeline for Privacy Pollution Monitor.

## ✅ Implementation Checklist

All CI/CD features have been implemented and are ready to use.

### Files Created

- [x] `LICENSE` - MIT License
- [x] `.github/workflows/test.yml` - Main test workflow
- [x] `.github/workflows/lint.yml` - Code quality workflow
- [x] `.github/workflows/deploy.yml` - Deployment workflow
- [x] `.solhint.json` - Solidity linter configuration
- [x] `.solhintignore` - Linter ignore rules
- [x] `codecov.yml` - Code coverage configuration
- [x] `.prettierrc.json` - Code formatter configuration
- [x] `.prettierignore` - Formatter ignore rules
- [x] `CI_CD.md` - Complete CI/CD documentation

### Features Implemented

- [x] Automated testing on push to main/develop
- [x] Automated testing on all pull requests
- [x] Multi-version Node.js testing (18.x, 20.x)
- [x] Code quality checks with Solhint
- [x] Code coverage with Codecov
- [x] Security analysis with Slither
- [x] Gas usage reporting
- [x] Contract size checking
- [x] Code formatting with Prettier

## 🚀 Quick Start

### 1. Push to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Add CI/CD pipeline with GitHub Actions"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/privacy-pollution-monitor.git

# Push to GitHub
git push -u origin main
```

### 2. Configure GitHub Secrets

Navigate to your GitHub repository settings and add these secrets:

**Repository → Settings → Secrets and variables → Actions → New repository secret**

Required secrets:

```
CODECOV_TOKEN          - Get from https://codecov.io
SEPOLIA_RPC_URL        - Your Sepolia RPC endpoint (optional for testing)
PRIVATE_KEY            - Wallet private key (for deployment only)
ETHERSCAN_API_KEY      - Etherscan API key (for verification only)
```

### 3. Set Up Codecov

1. Visit https://codecov.io
2. Sign in with GitHub
3. Add your repository
4. Copy the upload token
5. Add token as `CODECOV_TOKEN` in GitHub Secrets

### 4. Verify Workflow Setup

After pushing to GitHub:

1. Go to repository → **Actions** tab
2. You should see workflows running
3. Wait for all jobs to complete
4. Check for green checkmarks ✅

## 📋 Workflow Details

### Test Workflow (`test.yml`)

**Triggers**:
- Push to `main`, `develop`, or `master` branches
- Pull requests to `main`, `develop`, or `master` branches

**Jobs**:

#### 1. Test Job (Matrix Strategy)
Runs on Node.js 18.x and 20.x

**Steps**:
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies with `npm ci`
4. Compile smart contracts
5. Run Solidity linter (Solhint)
6. Execute test suite
7. Generate coverage report
8. Upload coverage to Codecov
9. Archive test results

**Artifacts**:
- Test results for each Node version
- Coverage reports

#### 2. Lint Job
Code quality checks

**Steps**:
1. Run Solhint on Solidity files
2. Check contract sizes
3. Validate code quality

#### 3. Security Job
Security analysis

**Steps**:
1. Run Slither static analysis
2. Generate SARIF report
3. Upload to GitHub Security

#### 4. Gas Report Job
Gas usage monitoring

**Steps**:
1. Generate gas report
2. Archive results
3. Track optimization

### Lint Workflow (`lint.yml`)

**Triggers**: Same as test workflow

**Jobs**:
1. **Solidity Linting** - Check Solidity code style
2. **Prettier Check** - Verify code formatting
3. **Contract Size** - Ensure contracts within limits

### Deploy Workflow (`deploy.yml`)

**Trigger**: Manual (workflow_dispatch)

**Features**:
- Deploy to Sepolia or localhost
- Automatic contract verification
- Deployment artifact archival

## 🔧 Testing the Pipeline

### Test Locally Before Push

```bash
# Install dependencies
npm install

# Run linter
npm run lint:sol

# Format code
npm run format

# Run tests
npm test

# Generate coverage
npm run coverage

# Check contract sizes
npm run size
```

### Test GitHub Actions

1. **Create a test branch**:
```bash
git checkout -b test/ci-pipeline
```

2. **Make a small change** (e.g., add a comment):
```solidity
// Test CI/CD pipeline
```

3. **Commit and push**:
```bash
git add .
git commit -m "test: Verify CI/CD pipeline"
git push origin test/ci-pipeline
```

4. **Create Pull Request**:
- Go to GitHub repository
- Click "Pull requests" → "New pull request"
- Select your test branch
- Create pull request

5. **Watch Actions Run**:
- Go to "Actions" tab
- See workflow executing
- All jobs should complete successfully

6. **Check Results**:
- ✅ All tests passed
- ✅ Code quality checks passed
- ✅ Coverage report uploaded
- ✅ Security scan completed

## 📊 Understanding Workflow Results

### Successful Run

All jobs show green checkmarks (✅):

```
Test on Node.js 18.x ✅
Test on Node.js 20.x ✅
Code Quality Checks ✅
Security Analysis ✅
Gas Usage Report ✅
```

### Failed Run

Red X (❌) indicates failure:

```
Test on Node.js 18.x ✅
Test on Node.js 20.x ❌  <- Click to see error
Code Quality Checks ✅
```

**How to fix**:
1. Click on failed job
2. Expand error logs
3. Fix the issue locally
4. Push fix
5. Pipeline re-runs automatically

### Viewing Coverage

**In Pull Request**:
- Codecov bot will comment with coverage report
- Shows coverage diff
- Highlights uncovered lines

**In Codecov Dashboard**:
1. Visit https://codecov.io/gh/YOUR_USERNAME/privacy-pollution-monitor
2. View detailed coverage
3. Browse source code with coverage overlay
4. Track trends over time

### Security Findings

**View in GitHub**:
1. Go to repository
2. Click "Security" tab
3. Click "Code scanning"
4. View Slither findings

## 🎯 CI/CD Best Practices

### 1. Always Test Locally First

```bash
# Before pushing
npm run lint:sol
npm run format:check
npm test
npm run coverage
```

### 2. Write Descriptive Commit Messages

```bash
# Good
git commit -m "feat: Add pollution alert threshold feature"
git commit -m "fix: Resolve report verification bug"
git commit -m "test: Add edge case tests for station management"

# Bad
git commit -m "update"
git commit -m "fix stuff"
```

### 3. Keep Branches Up to Date

```bash
# Update from main
git checkout main
git pull origin main

# Update feature branch
git checkout feature-branch
git merge main
```

### 4. Review CI Failures Promptly

- Check failed jobs immediately
- Fix issues before merging
- Never force merge with failing tests

## 🔒 Security Setup

### Required Secrets for Full Functionality

**For Testing** (Optional):
```
SEPOLIA_RPC_URL - Only needed for Sepolia network tests
```

**For Deployment** (Optional):
```
PRIVATE_KEY - Only needed for actual deployment
ETHERSCAN_API_KEY - Only needed for contract verification
```

**For Coverage** (Recommended):
```
CODECOV_TOKEN - Required for coverage reporting
```

### Adding Secrets

1. **Navigate**: Repository → Settings → Secrets and variables → Actions
2. **Click**: "New repository secret"
3. **Add**:
   - Name: `CODECOV_TOKEN`
   - Value: (paste your token)
4. **Save**: Click "Add secret"

## 📈 Monitoring CI/CD Health

### GitHub Actions Dashboard

**View**:
- Repository → Actions tab
- See all workflow runs
- Filter by workflow, branch, or status

**Metrics to Monitor**:
- Success rate
- Build duration
- Test coverage trends
- Failed jobs

### Codecov Dashboard

**Track**:
- Overall coverage percentage
- Coverage trends
- File-level coverage
- Uncovered lines

### Weekly Review

**Check**:
1. All workflows passing?
2. Coverage maintained above 80%?
3. No security findings?
4. Gas usage optimized?

## 🛠️ Troubleshooting

### Workflow Not Running

**Check**:
1. `.github/workflows/` directory exists?
2. Workflow files have `.yml` extension?
3. Branch name matches trigger conditions?

**Solution**:
```bash
# Verify directory structure
ls -la .github/workflows/

# Should show:
# test.yml
# lint.yml
# deploy.yml
```

### Tests Fail in CI but Pass Locally

**Common Causes**:
1. Different Node.js version
2. Missing dependencies
3. Environment differences

**Solution**:
```bash
# Match CI Node version
nvm use 20

# Clean install
rm -rf node_modules package-lock.json
npm install
npm test
```

### Coverage Upload Fails

**Check**:
1. `CODECOV_TOKEN` secret exists?
2. Token is valid?
3. Repository added to Codecov?

**Solution**:
1. Verify token in Codecov dashboard
2. Re-add secret in GitHub
3. Re-run workflow

### Linting Errors

**Fix**:
```bash
# Auto-fix issues
npm run lint:fix

# Manual fixes for remaining issues
npm run lint:sol
```

### Contract Size Exceeds Limit

**Warning**: Contracts larger than 24KB

**Solutions**:
1. Split into multiple contracts
2. Use libraries
3. Optimize code
4. Remove unused functions

## 📝 Quick Reference

### Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `test.yml` | Main test suite | Push to main/develop, PRs |
| `lint.yml` | Code quality | Push to main/develop, PRs |
| `deploy.yml` | Deployment | Manual |

### npm Scripts

| Command | Purpose |
|---------|---------|
| `npm test` | Run tests |
| `npm run coverage` | Generate coverage |
| `npm run lint:sol` | Lint Solidity |
| `npm run lint:fix` | Auto-fix linting |
| `npm run format` | Format code |
| `npm run size` | Check contract sizes |

### Node.js Versions Tested

- Node.js 18.x (LTS)
- Node.js 20.x (LTS)

## ✅ Verification Checklist

Before considering CI/CD complete:

- [ ] All workflow files created
- [ ] Pushed to GitHub
- [ ] Codecov configured
- [ ] Secrets added (at least CODECOV_TOKEN)
- [ ] First workflow run successful
- [ ] Test on both Node versions passed
- [ ] Coverage uploaded successfully
- [ ] Linting passed
- [ ] Security scan completed
- [ ] Documentation reviewed

## 🎉 Success Indicators

Your CI/CD is working correctly when:

✅ **Green checkmarks** on all workflow runs
✅ **Coverage badge** shows on Codecov
✅ **No security findings** or addressed
✅ **Tests pass** on all Node versions
✅ **Linting passes** without errors
✅ **Pull requests** show automated checks

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Solhint Rules](https://github.com/protofire/solhint/blob/master/docs/rules.md)
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)

## 🆘 Getting Help

If you encounter issues:

1. Check workflow logs in Actions tab
2. Review error messages
3. Consult troubleshooting section
4. Check configuration files
5. Verify secrets are set correctly

---

**CI/CD Status**: ✅ Ready to Use
**Last Updated**: 2024
**All English**: ✅ No project-specific naming
