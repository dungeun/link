#!/bin/bash

# REVU Platform Local CI Test Script
# Runs comprehensive checks before git push

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run a command and check its exit status
run_check() {
    local description="$1"
    local command="$2"
    
    print_status "Running: $description"
    
    if eval "$command"; then
        print_success "$description passed"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Start CI checks
echo "🚀 Starting REVU Platform Local CI Tests"
echo "======================================="

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Track overall status
overall_status=0

# 1. Install dependencies
print_status "Checking dependencies..."
if ! npm ci --silent; then
    print_warning "npm ci failed, trying npm install..."
    npm install
fi

# 2. Generate Prisma client
print_status "Generating Prisma client..."
if ! npm run db:generate; then
    print_error "Prisma client generation failed"
    overall_status=1
fi

# 3. TypeScript type checking
if ! run_check "TypeScript type checking" "npm run typecheck"; then
    overall_status=1
fi

# 4. Linting
if ! run_check "ESLint checks" "npm run lint"; then
    overall_status=1
fi

# 5. Security linting (if security config exists)
if [[ -f ".eslintrc.security.js" ]]; then
    if ! run_check "Security linting" "npm run lint:security"; then
        overall_status=1
    fi
else
    print_warning "Security linting config not found, skipping..."
fi

# 6. Format checking
if ! run_check "Prettier format check" "npm run format:check"; then
    print_warning "Code formatting issues found. Run 'npm run format' to fix."
    overall_status=1
fi

# 7. Generate cache (required for build)
if ! run_check "Cache generation" "npm run cache:generate"; then
    overall_status=1
fi

# 8. Production build test
if ! run_check "Production build" "npm run build:prod"; then
    overall_status=1
fi

# 9. Unit tests (if any exist)
if [[ -d "tests" ]] || [[ -f "jest.config.js" ]]; then
    if ! run_check "Unit tests" "npm test -- --passWithNoTests"; then
        overall_status=1
    fi
else
    print_warning "No Jest tests found, skipping unit tests..."
fi

# 10. Database verification (if local database exists)
if [[ -f "prisma/dev.db" ]] || [[ -n "$DATABASE_URL" ]]; then
    if ! run_check "Database verification" "npm run db:verify"; then
        print_warning "Database verification failed, but continuing..."
    fi
else
    print_warning "No local database found, skipping database verification..."
fi

# 11. Basic E2E tests (quick smoke test)
print_status "Running basic E2E smoke tests..."
if command -v npx >/dev/null 2>&1; then
    # Run a quick auth test if it exists
    if [[ -f "tests/standalone/simple-auth-test.spec.ts" ]]; then
        if ! npx playwright test tests/standalone/simple-auth-test.spec.ts --timeout=30000; then
            print_warning "E2E smoke test failed, but continuing..."
        else
            print_success "E2E smoke test passed"
        fi
    else
        print_warning "No E2E smoke tests found, skipping..."
    fi
else
    print_warning "Playwright not available, skipping E2E tests..."
fi

# 12. Check for common issues
print_status "Checking for common issues..."

# Check for console.log statements (warning only)
if grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    print_warning "console.log statements found in source code"
fi

# Check for TODO/FIXME comments
if grep -r -i "TODO\|FIXME" src/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    print_warning "TODO/FIXME comments found in source code"
fi

# Check for sensitive patterns
if grep -r -i "password.*=.*['\"][^'\"]*['\"]" src/ --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    print_error "Potential hardcoded passwords found"
    overall_status=1
fi

# 13. Git status check
print_status "Checking git status..."
if [[ -n "$(git status --porcelain)" ]]; then
    print_warning "Uncommitted changes found:"
    git status --short
else
    print_success "All changes are committed"
fi

# Final results
echo ""
echo "======================================="
if [[ $overall_status -eq 0 ]]; then
    print_success "🎉 All CI checks passed! Ready to push to main branch."
    echo ""
    echo "Next steps:"
    echo "  git push origin main"
    exit 0
else
    print_error "❌ Some CI checks failed. Please fix the issues before pushing."
    echo ""
    echo "Common fixes:"
    echo "  - Run 'npm run format' to fix formatting"
    echo "  - Run 'npm run lint -- --fix' to fix linting issues"
    echo "  - Check TypeScript errors and fix them"
    echo "  - Ensure all tests pass"
    exit 1
fi