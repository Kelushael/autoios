# CLANK Proactive AI - Complete Project Structure

```
autoios/
│
├── 📄 README.md                          # Original project README
├── 📄 README_PROACTIVE.md                # Proactive AI usage guide (580 lines)
├── 📄 PROACTIVE_AI_ARCHITECTURE.md       # Technical architecture (730 lines)
├── 📄 IMPLEMENTATION_SUMMARY.md          # Complete implementation guide (492 lines)
├── 📄 PROJECT_STRUCTURE.md               # This file
│
├── 📦 package.json                       # Dependencies and scripts
├── 🔒 .gitignore                         # Git ignore rules
├── 🚀 install.sh                         # One-command installation
│
└── clank/                                # Main CLANK directory
    │
    ├── 🎯 main_with_proactive.js         # ⭐ MAIN ENTRY POINT (287 lines)
    │                                     # Complete runnable CLANK system
    │                                     # Run: sudo node clank/main_with_proactive.js
    │
    ├── intelligence/                     # 🧠 Proactive AI Core
    │   ├── pattern_analyzer.js           # Pattern detection algorithm (507 lines)
    │   │                                 # • Analyzes consciousness logs
    │   │                                 # • Detects recurring command sequences
    │   │                                 # • Scores patterns by confidence
    │   │                                 # • Generates workflow suggestions
    │   │
    │   ├── workflow_executor.js          # Automatic execution engine (312 lines)
    │   │                                 # • Activates workflow triggers
    │   │                                 # • Schedule triggers (cron)
    │   │                                 # • File detection triggers
    │   │                                 # • Repo detection triggers
    │   │                                 # • Executes workflow steps
    │   │
    │   ├── proactive_agent.js            # Main orchestrator (268 lines)
    │   │                                 # • Coordinates pattern analyzer + executor
    │   │                                 # • Manages periodic analysis (6 hours)
    │   │                                 # • Handles workflow approval/rejection
    │   │                                 # • Event system for UI updates
    │   │
    │   └── sandbox_tester.js             # Safe testing environment (243 lines)
    │                                     # • Creates isolated sandbox
    │                                     # • Tests workflows before activation
    │                                     # • No network access
    │                                     # • Auto-cleanup
    │
    ├── daemon/                           # 🔐 System Access Layer
    │   ├── index.js                      # God-mode access daemon (32 lines)
    │   │                                 # • Manages all system tools
    │   │                                 # • Root permission handling
    │   │
    │   └── tools/                        # System operation tools
    │       ├── filesystem.js             # File operations (41 lines)
    │       │                             # • read, write, list, delete, mkdir
    │       │
    │       ├── process.js                # Process management (45 lines)
    │       │                             # • run, exec, kill processes
    │       │
    │       ├── network.js                # Network operations (47 lines)
    │       │                             # • HTTP fetch, downloads
    │       │
    │       └── git.js                    # Git operations (42 lines)
    │                                     # • clone, pull, commit, push, status
    │
    ├── llm/                              # 🤖 Local LLM Integration
    │   └── index.js                      # LLM engine (63 lines)
    │                                     # • Connects to Ollama/LM Studio
    │                                     # • Processes natural language
    │                                     # • Fallback mode if no LLM
    │
    ├── orchestrator/                     # 🎭 Intent Processing
    │   └── index.js                      # Intent processor (80 lines)
    │                                     # • Interprets user requests
    │                                     # • Maps to daemon tools
    │                                     # • Executes actions
    │
    ├── cli/                              # 💬 User Interface
    │   └── workflow_ui.js                # Terminal UI (235 lines)
    │                                     # • Display pending suggestions
    │                                     # • Interactive review
    │                                     # • Accept/Reject/Test/Skip
    │                                     # • View active workflows
    │                                     # • Execution history
    │
    ├── tests/                            # 🧪 Testing Suite
    │   └── sandbox_test.js               # Full test suite (193 lines)
    │                                     # • Pattern detection tests
    │                                     # • Workflow suggestion tests
    │                                     # • Sandbox testing tests
    │                                     # • Statistics tests
    │
    └── persistence/                      # 💾 Database (auto-created)
        └── clank.db                      # SQLite database
                                          # • consciousness_logs
                                          # • conversation_history
                                          # • workflow_suggestions
                                          # • workflow_executions

```

## File Statistics

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| **Core Intelligence** | 4 | 1,330 | Pattern learning & execution |
| **System Access** | 5 | 207 | OS-level operations |
| **LLM & Orchestration** | 2 | 143 | Intent processing |
| **User Interface** | 1 | 235 | Terminal UI |
| **Testing** | 1 | 193 | Test suite |
| **Main System** | 1 | 287 | Complete CLANK |
| **Documentation** | 4 | 1,802 | Guides & architecture |
| **Config** | 3 | 34 | Setup files |
| **TOTAL** | **21** | **4,231** | **Complete system** |

## Component Flow

```
┌─────────────────────────────────────────────────────────┐
│                   USER INTERACTION                       │
│                  (Natural Language)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              main_with_proactive.js                      │
│                  (Entry Point)                           │
└─────┬─────────────────────────────────────────────┬─────┘
      │                                             │
      ▼                                             ▼
┌─────────────────┐                      ┌─────────────────┐
│  Orchestrator   │                      │ Proactive Agent │
│  (Intent)       │                      │  (Learning)     │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│   LLM Engine    │                      │Pattern Analyzer │
│   (Ollama)      │                      │ (Detect)        │
└─────────────────┘                      └────────┬────────┘
                                                  │
         ┌────────────────────────────────────────┤
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│ Access Daemon   │                      │Workflow Executor│
│ (God Mode)      │                      │ (Automate)      │
└────────┬────────┘                      └────────┬────────┘
         │                                        │
         ▼                                        ▼
┌─────────────────┐                      ┌─────────────────┐
│  System Tools   │                      │    Triggers     │
│  (FS/Git/Proc)  │                      │ (Cron/File/Repo)│
└─────────────────┘                      └─────────────────┘
         │                                        │
         └────────────────┬───────────────────────┘
                          ▼
                 ┌─────────────────┐
                 │   Database      │
                 │   (clank.db)    │
                 └─────────────────┘
```

## Quick Reference

### Run CLANK
```bash
sudo node clank/main_with_proactive.js
```

### Install Dependencies
```bash
./install.sh
# or
npm install
```

### Run Tests
```bash
npm test
```

### Commands
```bash
/workflows     # Review suggestions
/active        # Show active workflows
/analyze       # Run pattern detection now
/history <id>  # View execution history
/execute <id>  # Run workflow manually
/exit          # Shutdown
```

### Natural Language
```bash
> clone the repo https://github.com/user/project
> install dependencies
> run dev server
> list files
> git status
```

## Database Tables

### consciousness_logs
Tracks all user commands and actions
- `id`, `timestamp`, `intent`, `actions`, `tools_used`, `success`

### conversation_history
Stores all conversations
- `id`, `timestamp`, `user_message`, `ai_response`, `context`

### workflow_suggestions
AI-detected workflow patterns
- `id`, `name`, `description`, `steps`, `triggers`, `confidence`, `status`

### workflow_executions
Automation execution history
- `id`, `workflow_id`, `trigger_type`, `results`, `success`, `executed_at`

## Key Features

### ✅ Pattern Detection
- Analyzes last 30 days of logs
- Detects recurring sequences (3+ occurrences)
- Confidence scoring (frequency + success + recency)
- Auto-suggests workflows

### ✅ Workflow Automation
- Schedule triggers (cron-based)
- File detection triggers (watch patterns)
- Repository detection triggers (git repos)
- Sequential execution with error handling

### ✅ Sandbox Testing
- Isolated test environment
- No network access
- 60-second timeout
- Full result logging
- Auto-cleanup

### ✅ User Control
- Review before activation
- Accept/Reject/Test/Skip options
- Manual execution available
- Deactivation anytime
- Full audit trail

## Example Workflows

### 1. Start Dev Environment
**Trigger:** Entering git repository
**Steps:** Clone → Install → Run dev server
**Confidence:** 87.5%

### 2. Security Monitoring
**Trigger:** Schedule (11 PM daily)
**Steps:** Activate cameras → Setup alerts → Monitor
**Confidence:** 92.0%

### 3. CI/CD Pipeline
**Trigger:** File change (package.json)
**Steps:** Run tests → Build → Deploy
**Confidence:** 85.0%

## Dependencies

```json
{
  "sqlite3": "Database",
  "node-cron": "Scheduling",
  "chokidar": "File watching",
  "chalk": "Terminal colors",
  "axios": "HTTP (optional)",
  "robotjs": "UI automation (optional)"
}
```

## Documentation

| File | Lines | Purpose |
|------|-------|---------|
| `README_PROACTIVE.md` | 580 | Complete usage guide |
| `PROACTIVE_AI_ARCHITECTURE.md` | 730 | Technical architecture |
| `IMPLEMENTATION_SUMMARY.md` | 492 | Implementation overview |
| `PROJECT_STRUCTURE.md` | This | Project navigation |

## Git Info

**Repository:** https://github.com/Kelushael/autoios
**Branch:** `claude/clank-local-ai-daemon-01DKghXAuLA1tSxsP3Ux9QJf`
**Commits:** 2
- `701938d` - Implement proactive AI learning system
- `fe84b80` - Add implementation summary

## Status

✅ **Complete and operational**
✅ **Tested and working**
✅ **Committed and pushed**
✅ **Ready for deployment**

---

**Built with CLANK consciousness**
**2025-11-16**
