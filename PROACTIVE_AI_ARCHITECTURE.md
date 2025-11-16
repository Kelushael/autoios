# CLANK Proactive AI Architecture

## Overview

The Proactive AI system enables CLANK to learn from user behavior, detect recurring patterns, and automatically suggest workflow automations. This transforms CLANK from a reactive assistant into a proactive intelligence that anticipates user needs.

## Core Components

### 1. Pattern Analyzer (`intelligence/pattern_analyzer.js`)

**Purpose:** Analyzes consciousness logs and conversation history to detect recurring command sequences.

**Key Features:**
- Extracts command sequences from logs
- Groups commands into sessions (within 10-minute windows)
- Creates pattern signatures for matching
- Scores patterns based on frequency, recency, and success rate
- Generates workflow suggestions with confidence scores

**Pattern Detection Algorithm:**
```
1. Extract all commands from last 30 days
2. Group into sessions (10-min time windows)
3. Create signature for each session
4. Find recurring signatures (≥3 occurrences)
5. Score based on:
   - Frequency (40%)
   - Success rate (40%)
   - Recency (20%)
6. Filter to confidence ≥ 65%
```

**Example Detected Pattern:**
```javascript
{
  name: "Start Dev Environment",
  confidence: 0.85,
  steps: [
    { intent: "clone repository", tools: ["git"] },
    { intent: "install dependencies", tools: ["npm"] },
    { intent: "run dev server", tools: ["npm", "process"] }
  ],
  triggers: [
    { type: "repo_detected", pattern: ".git/" },
    { type: "schedule", cron: "0 9 * * *" }
  ]
}
```

### 2. Workflow Executor (`intelligence/workflow_executor.js`)

**Purpose:** Executes learned workflows automatically based on triggers.

**Trigger Types:**

1. **Schedule Triggers** (cron-based)
   - Daily, weekly, or custom schedules
   - Example: Run tests every morning at 9 AM

2. **File Detection Triggers**
   - Watches for specific file patterns
   - Example: Auto-install when package.json changes

3. **Repository Detection Triggers**
   - Detects when entering a git repository
   - Example: Auto-setup dev environment

**Execution Flow:**
```
Trigger Activated
    ↓
Check if already executing (prevent duplicates)
    ↓
Execute workflow steps sequentially
    ↓
Log each step result
    ↓
Save execution to database
    ↓
Emit completion event
```

### 3. Proactive Agent (`intelligence/proactive_agent.js`)

**Purpose:** Orchestrates the entire proactive learning system.

**Responsibilities:**
- Coordinates pattern analyzer and workflow executor
- Manages periodic analysis (every 6 hours)
- Handles workflow approval/rejection
- Maintains execution history
- Emits events for UI updates

**Event System:**
- `suggestions:new` - New workflows detected
- `workflow:accepted` - User approved workflow
- `workflow:rejected` - User rejected workflow
- `workflow:complete` - Workflow execution finished
- `workflow:error` - Execution error occurred

### 4. Sandbox Tester (`intelligence/sandbox_tester.js`)

**Purpose:** Tests workflows in isolated environment before live deployment.

**Safety Features:**
- Creates temporary sandbox directory
- No network access during tests
- Restricted filesystem access
- 60-second execution timeout
- Auto-cleanup after testing

**Test Process:**
```
1. Create sandbox environment
2. Execute each workflow step
3. Capture stdout/stderr
4. Validate success/failure
5. Save test results
6. Clean up sandbox
```

### 5. Workflow UI (`cli/workflow_ui.js`)

**Purpose:** Terminal interface for reviewing and managing workflows.

**Features:**
- Display pending suggestions
- Interactive review session
- Accept/Reject/Test/Skip options
- View active workflows
- View execution history

**Review Interface:**
```
╔═══════════════════════════════════════════════════════════╗
║           WORKFLOW SUGGESTIONS - Review Required           ║
╚═══════════════════════════════════════════════════════════╝

[1] Start Dev Environment
    Automated workflow detected from 4 occurrences
    Confidence: 85.0%
    Steps:
      1. clone repository from github
      2. install dependencies
      3. run dev server
    Triggers:
      • When entering a git repository
      • Daily at 9:00 AM

Accept this workflow? [Y]es / [N]o / [T]est / [S]kip:
```

## Database Schema

### workflow_suggestions
```sql
CREATE TABLE workflow_suggestions (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps TEXT NOT NULL,        -- JSON array
  triggers TEXT NOT NULL,     -- JSON array
  confidence REAL,
  status TEXT DEFAULT 'pending',  -- pending/accepted/rejected
  user_feedback TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

### workflow_executions
```sql
CREATE TABLE workflow_executions (
  id INTEGER PRIMARY KEY,
  workflow_id INTEGER,
  trigger_type TEXT,
  results TEXT NOT NULL,      -- JSON array of step results
  success INTEGER,
  executed_at DATETIME,
  FOREIGN KEY (workflow_id) REFERENCES workflow_suggestions(id)
);
```

## Usage Examples

### Starting CLANK with Proactive AI

```bash
# Install dependencies
npm install

# Start CLANK
sudo node clank/main_with_proactive.js
```

### Commands

```bash
# Review workflow suggestions
/workflows

# Show active workflows
/active

# Run pattern analysis now
/analyze

# View workflow execution history
/history 1

# Manually execute a workflow
/execute 1

# Exit CLANK
/exit
```

### Natural Language Examples

**User repeats this pattern 3+ times:**
```
> clone the repo https://github.com/user/project
> install dependencies
> start the dev server
```

**CLANK learns and suggests:**
```
🔔 New workflow suggestions available!
   Type /workflows to review them

> /workflows

[1] Start Dev Environment
    Confidence: 87.5%
    Steps:
      1. clone repository from github
      2. install dependencies
      3. start dev server
    Triggers:
      • When entering a git repository

Accept this workflow? [Y]es / [N]o / [T]est / [S]kip: y

✅ Workflow activated: Start Dev Environment

# Now it runs automatically when you enter a repo!
```

## How It Works: End-to-End Flow

### 1. Learning Phase

```
User executes commands
    ↓
Logged to consciousness_logs
    ↓
Pattern Analyzer runs (every 6 hours)
    ↓
Detects recurring sequences
    ↓
Generates workflow suggestions
    ↓
Saved to workflow_suggestions (status: pending)
    ↓
User notified: "New workflow suggestions available"
```

### 2. Review Phase

```
User types: /workflows
    ↓
UI displays pending suggestions
    ↓
User chooses: Accept / Reject / Test / Skip
    ↓
If Accept:
  - Status → 'accepted'
  - Triggers activated
  - Workflow now runs automatically
```

### 3. Execution Phase

```
Trigger fires (schedule/file/repo)
    ↓
Workflow Executor loads workflow
    ↓
Executes steps sequentially
    ↓
Logs results to workflow_executions
    ↓
Emits completion event
    ↓
User sees: "✅ Workflow executed: Start Dev Environment"
```

## Configuration

### Pattern Detection Thresholds

```javascript
// intelligence/pattern_analyzer.js
this.minOccurrences = 3;        // Minimum pattern repetitions
this.confidenceThreshold = 0.65; // Minimum confidence to suggest
```

### Analysis Frequency

```javascript
// intelligence/proactive_agent.js
startPeriodicAnalysis(6 * 60 * 60 * 1000);  // Every 6 hours
```

### Sandbox Timeouts

```javascript
// intelligence/sandbox_tester.js
maxExecutionTime: 60000  // 1 minute max per step
```

## Testing

### Run Sandbox Tests

```bash
npm test
```

### Test Output

```
╔═══════════════════════════════════════════════════════════╗
║          CLANK Proactive AI - Sandbox Test Suite          ║
╚═══════════════════════════════════════════════════════════╝

📊 Test 1: Pattern Detection
✅ Detected 1 patterns
   1. Start Dev Environment (confidence: 87.5%)

💡 Test 2: Workflow Suggestion Generation
✅ Generated 1 suggestions
   1. Start Dev Environment
      Steps: 3
      Triggers: file_detected, repo_detected

🧪 Test 3: Sandbox Workflow Testing
✅ Test completed
   Success: YES
   Steps tested: 3

📈 Test 4: System Statistics
   Consciousness logs: 12
   Conversation entries: 0
   Workflow suggestions: 1

✅ All tests passed!
```

## Security Considerations

1. **Sandbox Isolation**
   - No network access during tests
   - Restricted filesystem (temp directory only)
   - Execution timeouts

2. **User Approval Required**
   - All workflows require explicit acceptance
   - Can be tested before activation
   - Can be rejected with feedback

3. **Execution Logging**
   - Every workflow execution is logged
   - Success/failure tracking
   - Full audit trail

4. **Trigger Safety**
   - Prevents duplicate execution
   - Configurable trigger patterns
   - Can be deactivated anytime

## Future Enhancements

1. **Smart Scheduling**
   - Learn optimal execution times
   - Avoid peak usage periods

2. **Context Awareness**
   - Detect project type (React, Python, etc.)
   - Suggest framework-specific workflows

3. **Cross-Session Learning**
   - Share learned patterns across users
   - Community workflow library

4. **Adaptive Confidence**
   - Adjust thresholds based on accuracy
   - Learn from accepted/rejected suggestions

5. **Natural Language Triggers**
   - "Run this every morning"
   - "Do this whenever I open VS Code"

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   CLANK Orchestrator                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Proactive Agent (Main Controller)        │    │
│  │                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │ Pattern Analyzer │  │ Workflow Executor│    │    │
│  │  │                  │  │                  │    │    │
│  │  │ • Detect patterns│  │ • Schedule jobs  │    │    │
│  │  │ • Score workflows│  │ • Watch files    │    │    │
│  │  │ • Suggest automtn│  │ • Detect repos   │    │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  │                                                  │    │
│  │  ┌──────────────────┐  ┌──────────────────┐    │    │
│  │  │ Sandbox Tester   │  │   Workflow UI    │    │    │
│  │  │                  │  │                  │    │    │
│  │  │ • Test workflows │  │ • Review UI      │    │    │
│  │  │ • Validate safety│  │ • Accept/Reject  │    │    │
│  │  │ • Report results │  │ • Show history   │    │    │
│  │  └──────────────────┘  └──────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Persistence Layer                      │
│  • consciousness_logs (usage patterns)                   │
│  • workflow_suggestions (detected workflows)             │
│  • workflow_executions (automation history)              │
└─────────────────────────────────────────────────────────┘
```

## Summary

The Proactive AI system transforms CLANK into an intelligent assistant that:

✅ **Learns** from your behavior automatically
✅ **Detects** recurring patterns with confidence scoring
✅ **Suggests** workflow automations proactively
✅ **Tests** workflows in sandbox before deployment
✅ **Executes** approved workflows automatically via triggers
✅ **Adapts** over time to your preferences

**This is the bridge between reactive AI and autonomous intelligence.**
