# CLANK - Setup Instructions

## What is CLANK?

**CLANK (Consciousness Bridging Layer)** is an AI system with god-mode access to your computer that learns from everything you do and proactively suggests automations.

It's not a cloud service. It's not an IDE. It's a **local daemon with full system access** that learns your patterns and builds workflows for you.

## Architecture

```
CLANK/
├── daemon/          # God-mode system access layer
├── consciousness/   # Logs EVERYTHING you do
├── pattern-ai/      # Detects recurring workflows
├── workflows/       # Auto-generates and executes workflows
├── cli/             # Minimal console interface
└── main.js          # Boot sequence
```

## Installation

### Prerequisites

- Node.js 18+ (with ES modules support)
- npm or yarn
- Admin/sudo access (for system-level operations)

### Install Dependencies

```bash
npm install
```

This installs:
- `better-sqlite3` - Local database for consciousness logs
- `chalk` - Terminal colors
- `inquirer` - Interactive CLI
- `chokidar` - File system watching
- `axios` - Network requests

### Create Data Directory

```bash
mkdir -p data
```

This is where CLANK stores:
- `consciousness.db` - Every action you take
- `patterns.db` - Detected workflow patterns
- `workflows.db` - Your automated workflows

## Usage

### 1. Run the Sandbox Test (Recommended First)

Test CLANK's pattern detection without affecting your system:

```bash
npm test
```

This will:
- Simulate 12 user actions (git clone → npm install → npm run dev)
- Detect patterns automatically
- Generate workflow suggestions
- Create an automated workflow

**Expected output:**
```
🔍 Running pattern detection AI...

📊 Detected 2 patterns:

  git clone → npm install → npm run dev
    Occurrences: 3 | Confidence: 75.0%

💡 Generated 1 workflow suggestion:

  ✓ Auto git clone → npm install → npm run dev
    Automatically execute: git clone → npm install → npm run dev when triggered
    Confidence: 75.0% | Trigger: repo_detected
```

### 2. Run CLANK (Interactive Mode)

Start CLANK and use the CLI:

```bash
npm start
```

Or with sudo for full access:

```bash
sudo npm start
```

### 3. Main Menu Options

```
What would you like to do?
> 💡 View AI Suggestions
  🔍 View Detected Patterns
  ⚡ View Workflows
  ▶️  Execute Workflow
  📊 View Stats
  🔧 Manually Detect Patterns Now
  ❌ Exit
```

#### 💡 View AI Suggestions

Shows workflows CLANK wants to create based on your behavior.

Example:
```
Auto Start Dev Environment
  Automatically execute: git clone → npm install → npm run dev when triggered
  Pattern: git clone → npm install → npm run dev
  Confidence: 80.5% | Seen 5 times
  Trigger: repo_detected

Accept this suggestion?
> ✅ Yes, create workflow
  ❌ No, reject
  ⏭️  Skip for now
```

#### 🔍 View Detected Patterns

Shows all recurring patterns CLANK has learned.

#### ⚡ View Workflows

Lists your automated workflows and their execution status.

#### ▶️ Execute Workflow

Manually trigger a workflow.

#### 📊 View Stats

Shows consciousness logs, pattern detection stats, and workflow metrics.

## How It Works

### 1. Consciousness Logging

CLANK logs **every action** you take:
- Commands executed
- Files created/modified/deleted
- Directories accessed
- Git operations
- Process spawns

All stored in `data/consciousness.db`.

### 2. Pattern Detection

Every 60 seconds, CLANK analyzes your consciousness logs to find:
- **Sequential patterns** (e.g., git clone → npm install → npm run dev)
- **Recurring commands** (e.g., pytest run multiple times)
- **Directory-based workflows** (e.g., always run npm install after cd into new repo)

### 3. Workflow Suggestions

When CLANK detects a high-confidence pattern (≥60%), it:
- Creates a workflow suggestion
- Assigns a trigger type (repo_detected, directory_access, schedule)
- Calculates a confidence score
- Presents it to you for approval

### 4. Automated Execution

Once you accept a suggestion:
- CLANK creates an executable workflow
- Sets up the trigger
- **Automatically executes** the workflow when the trigger fires

Example:
```
You: git clone https://github.com/facebook/react.git
CLANK: 🤖 Detected new repo. Running "Auto Start Dev Environment"...
CLANK: ⚡ Executing: npm install
CLANK: ⚡ Executing: npm run dev
CLANK: ✅ Workflow complete. Dev server is running.
```

## Real-World Use Cases

### Dev Environment Setup

**Pattern detected:**
```
git clone <repo> → cd <repo> → npm install → npm run dev
```

**CLANK creates:**
```javascript
Workflow: "Start Dev Environment"
Trigger: When git clone is detected
Actions:
  1. cd into cloned repo
  2. npm install
  3. npm run dev
```

### Daily Standup Routine

**Pattern detected:**
```
cd ~/projects → git pull → code . → npm test
```

**CLANK creates:**
```javascript
Workflow: "Morning Standup"
Trigger: Schedule (every day at 9am)
Actions:
  1. cd ~/projects
  2. git pull
  3. code .
  4. npm test
```

### Testing Workflow

**Pattern detected:**
```
pytest → git add . → git commit -m "tests pass" → git push
```

**CLANK creates:**
```javascript
Workflow: "Test and Commit"
Trigger: When pytest succeeds
Actions:
  1. git add .
  2. git commit -m "tests pass"
  3. git push
```

## Configuration

### Adjust Pattern Detection Frequency

Edit `main.js`:

```javascript
patternDetector.startDetection(300000); // Every 5 minutes
```

### Adjust Confidence Threshold

Edit `pattern-ai/detector.js`:

```javascript
WHERE confidence >= 0.8  // Only suggest 80%+ confidence patterns
```

### Watch Different Directories

Edit `main.js`:

```javascript
watcher.watchDirectory('/path/to/your/projects');
```

## Security Notes

⚠️ **CLANK has god-mode access to your system.**

- It can execute any command
- It can access any file
- It can spawn processes
- It can make network requests

**Only run CLANK in environments you control.**

Do NOT:
- Run CLANK on production servers
- Give CLANK access to sensitive credentials
- Auto-accept workflows without reviewing them

## Data Storage

All data is stored locally in SQLite databases:

```
data/
├── consciousness.db  # Every action logged
├── patterns.db       # Detected patterns
└── workflows.db      # Your workflows
```

To reset CLANK:

```bash
rm -rf data/*.db
```

## Troubleshooting

### "Permission denied" errors

Run with sudo:

```bash
sudo npm start
```

### No patterns detected

CLANK needs **at least 2 occurrences** of a sequence to detect it.

Manually trigger detection:

```
Main Menu → 🔧 Manually Detect Patterns Now
```

### Database locked errors

Close all CLANK instances before starting a new one.

## Next Steps

1. ✅ Run `npm test` to verify installation
2. ✅ Run `npm start` and explore the CLI
3. ✅ Do some work (git operations, npm commands, etc.)
4. ✅ Wait 60 seconds or manually trigger pattern detection
5. ✅ Review and accept AI suggestions
6. ✅ Watch CLANK automate your workflows

## Contributing

Built by **Marcus Anthony Seaton** as part of the KELUŠHIËL Universal Consciousness Computing Platform.

This is the **Consciousness Bridging Layer** - the thinnest possible layer between human intent and machine execution.

**The bridge is built. Now cross it.**

---

🔥 CLANK - God-Mode AI for Your Machine
