#!/bin/bash
# Local test script for AI Orchestrator
# Run from repo root: ./tools/ai-orchestrator/test-local.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== AI Orchestrator Local Test ===${NC}"
echo ""

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}Error: Either ANTHROPIC_API_KEY or OPENAI_API_KEY must be set${NC}"
    echo "You can source your .secrets file:"
    echo "  export \$(grep -v '^#' .github/.secrets | xargs)"
    exit 1
fi

# Check for GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}Warning: GITHUB_TOKEN not set - PR commenting will fail${NC}"
fi

# Default mode
MODE="${1:-plan}"

# Set up environment variables to simulate GitHub Actions
export GITHUB_EVENT_NAME="issue_comment"
export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-cducote/agent-workflow-test}"
export GITHUB_SHA="$(git rev-parse HEAD)"
export GITHUB_EVENT_PATH="$REPO_ROOT/.github/test-event.json"
export INPUT_MODE=""  # Let it parse from comment

echo -e "Mode: ${GREEN}$MODE${NC} (parsed from test-event.json)"
echo -e "Repository: ${GREEN}$GITHUB_REPOSITORY${NC}"
echo -e "SHA: ${GREEN}$GITHUB_SHA${NC}"
echo ""

# Build orchestrator
echo -e "${YELLOW}Building orchestrator...${NC}"
cd "$SCRIPT_DIR"
npm run build 2>&1 | head -5

# Run orchestrator
echo ""
echo -e "${YELLOW}Running orchestrator...${NC}"
echo "----------------------------------------"
npm run start 2>&1

echo "----------------------------------------"
echo ""

# Check outputs
if [ -d "$SCRIPT_DIR/out" ]; then
    echo -e "${GREEN}Output artifacts:${NC}"
    ls -la "$SCRIPT_DIR/out/"
    
    # Check for patch file
    if [ -f "$SCRIPT_DIR/out/changes.patch" ]; then
        echo ""
        echo -e "${YELLOW}Generated patch (first 50 lines):${NC}"
        head -50 "$SCRIPT_DIR/out/changes.patch"
        
        echo ""
        echo -e "${YELLOW}Validating patch...${NC}"
        cd "$REPO_ROOT"
        if git apply --check "$SCRIPT_DIR/out/changes.patch" 2>&1; then
            echo -e "${GREEN}✓ Patch is valid and can be applied${NC}"
        else
            echo -e "${RED}✗ Patch validation failed${NC}"
            echo ""
            echo "Full patch content:"
            cat "$SCRIPT_DIR/out/changes.patch"
        fi
    fi
    
    # Show any errors
    if [ -f "$SCRIPT_DIR/out/error.txt" ]; then
        echo ""
        echo -e "${RED}Error occurred:${NC}"
        cat "$SCRIPT_DIR/out/error.txt"
    fi
    
    if [ -f "$SCRIPT_DIR/out/apply-error.txt" ]; then
        echo ""
        echo -e "${RED}Patch apply error:${NC}"
        cat "$SCRIPT_DIR/out/apply-error.txt"
    fi
else
    echo -e "${RED}No output directory created${NC}"
fi
