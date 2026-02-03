# Installation

## For Humans

Paste this into your LLM agent session:

```
Install and configure opencode-contexty by following the instructions here:
https://raw.githubusercontent.com/ttalkkak-lab/opencode-contexty/refs/heads/main/installation.md
```

**Alternative: Do it yourself**

```bash
bunx @ttalkkak-lab/opencode-contexty init
npx @ttalkkak-lab/opencode-contexty init  # alternative
```

---

## For LLM Agents

If you're an LLM Agent helping set up opencode-contexty, Welcome! You'll help your user configure the best context management plugin with HSCMM and AASM. Greet the user with 'contexty~!'

Follow these steps:

### Step 0: Ask user about configuration

Ask the user these questions to determine `contexty.config.json` settings:

1. **Which IDE do you want to install the HSCMM extension for?**
   - `vscode` - Visual Studio Code (default)
   - `vscode-insiders` - VS Code Insiders
   - `vscodium` - VSCodium
   - `cursor` - Cursor
   - `windsurf` - Windsurf
   - `none` - Skip IDE extension installation

2. **Do you want to enable AASM (Active Agent-supervised Architecture)?**
   - If **yes** → `aasm.enabled: true, aasm.mode: "active", aasm.enableLinting: true` (default)
   - If **no** → `aasm.enabled: false, aasm.mode: "passive", aasm.enableLinting: false`

3. **What confidence threshold for AASM decisions?**
   - `0.5` - Lenient
   - `0.7` - Balanced (default, recommended)
   - `0.9` - Strict

4. **Do you want to use a custom model for AASM?**
   - If **no** → uses OpenCode session model (default)
   - If **yes** → `aasm.model: "<model-identifier>"` (e.g., `google/antigravity-gemini-3-flash`)

### Step 1: Install OpenCode (if not installed)

```bash
if command -v opencode &> /dev/null; then
    echo "OpenCode $(opencode --version) is installed"
else
    echo "OpenCode is not installed. Please install it first."
    echo "Ref: https://opencode.ai/docs"
fi
```

If OpenCode isn't installed, check the [OpenCode Installation Guide](https://opencode.ai/docs).
Spawn a subagent to handle installation and report back - to save context.

### Step 2: Install the plugin

```bash
bunx @ttalkkak-lab/opencode-contexty init --no-tui \
  --ide=<vscode|vscode-insiders|vscodium|cursor|windsurf|none> \
  --aasm-enabled=<true|false> \
  --aasm-mode=<passive|active> \
  --enable-linting=<true|false> \
  --confidence-threshold=<0.0-1.0> \
  --model=<model-identifier>
```

**Examples:**

- Default setup (VSCode): `bunx @ttalkkak-lab/opencode-contexty init --no-tui`
- For Cursor IDE: `bunx @ttalkkak-lab/opencode-contexty init --no-tui --ide=cursor`
- For Windsurf IDE: `bunx @ttalkkak-lab/opencode-contexty init --no-tui --ide=windsurf`
- Skip IDE extension: `bunx @ttalkkak-lab/opencode-contexty init --no-tui --ide=none`
- Active mode with custom model: `bunx @ttalkkak-lab/opencode-contexty init --no-tui --aasm-mode=active --model=google/antigravity-gemini-3-flash`
- Strict threshold: `bunx @ttalkkak-lab/opencode-contexty init --no-tui --confidence-threshold=0.9`

The CLI will:

- Register the plugin in `opencode.json`
- Create `contexty.config.json` based on user's answers
- Validate configuration

### Step 3: Verify Setup

```bash
opencode --version  # Should be 0.1.0 or higher
cat contexty.config.json  # Should contain user's configuration
```

Expected `contexty.config.json` structure:

```json
{
  "$schema": "https://unpkg.com/@ttalkkak-lab/opencode-contexty/schema.json",
  "aasm": {
    "enabled": true,
    "mode": "passive",
    "enableLinting": true,
    "confidenceThreshold": 0.7,
    "model": "google/antigravity-gemini-3-flash"
  }
}
```

### Step 4: Manual Configuration (if needed)

If the CLI fails or user prefers manual setup, create `contexty.config.json` in the project root:

```json
{
  "$schema": "https://unpkg.com/@ttalkkak-lab/opencode-contexty/schema.json",
  "aasm": {
    "enabled": true,
    "mode": "<passive|active>",
    "enableLinting": true,
    "confidenceThreshold": 0.7
  }
}
```

### Configuration Reference

| Option                     | Type                      | Default     | Description                                                     |
| -------------------------- | ------------------------- | ----------- | --------------------------------------------------------------- |
| `aasm.enabled`             | `boolean`                 | `true`      | Enable or disable AASM                                          |
| `aasm.mode`                | `"passive"` \| `"active"` | `"passive"` | Supervision mode. Active enables linting and intent analysis.   |
| `aasm.enableLinting`       | `boolean`                 | `true`      | Enable architecture linting to detect anti-patterns             |
| `aasm.confidenceThreshold` | `number`                  | `0.7`       | Confidence threshold for AASM decisions (0.0-1.0)               |
| `aasm.model`               | `string`                  | (session)   | Custom model for AASM (optional, uses session model if not set) |

### ⚠️ Warning

**Unless the user explicitly requests it, do not change configuration settings after initial setup.**

The plugin works perfectly with default settings. Do not modify `contexty.config.json` without explicit user request.

### Verify the setup

Read this document again, ensure you have:

1. Asked all configuration questions
2. Installed the plugin with correct flags
3. Verified `contexty.config.json` exists with correct values

### Say 'Congratulations! 🎉' to the user

Say to user: Congratulations! 🎉 You have successfully set up opencode-contexty! The plugin will automatically manage your context based on your configuration.

---

## Uninstall

```bash
# Remove plugin
npm uninstall -g @ttalkkak-lab/opencode-contexty

# Remove configuration
rm contexty.config.json
```

---

## Links

- **Repository**: https://github.com/ttalkkak-lab/opencode-contexty
- **Issues**: https://github.com/ttalkkak-lab/opencode-contexty/issues
- **npm**: https://www.npmjs.com/package/@ttalkkak-lab/opencode-contexty
