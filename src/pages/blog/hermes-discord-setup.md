---
layout: ../../components/BlogLayout.astro
title: "Setting Up Hermes Agent on a Cloud VPS with a Discord Bot"
date: "2026-09-06"
description: "Full walkthrough of setting up Hermes Agent on a cloud VPS with a Discord bot — intents, invite, DMs, systemd."
tags: ["ai", "hermes-agent", "discord", "bot", "vps", "automation", "nous-research"]
draft: false
---

# Setting Up Hermes Agent on a Cloud VPS with a Discord Bot

I recently set up [Hermes Agent](https://github.com/NousResearch/hermes-agent) — an open-source AI agent framework by Nous Research — on a cloud VPS and connected it to Discord as a bot. Here's the full walkthrough, including the things that don't work out of the box and the troubleshooting steps that saved me hours.

## What is Hermes Agent?

Hermes is a terminal-native AI agent that works with any LLM provider (OpenRouter, OpenAI, Anthropic, Google, local models, and 20+ others). Beyond the CLI, it has a messaging gateway that runs on 21+ platforms — Discord, Telegram, Slack, WhatsApp, Matrix, Signal, and more — giving the agent full tool access through chat, not just text responses.

I wanted it running persistently on a VPS and accessible through a Discord bot in a dedicated server.

---

## Step 1 — Install Hermes on the VPS

The official install script handles everything: uv, Python, the virtual environment, and the launcher.

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

After install, verify it's working:

```bash
hermes --help
hermes setup          # interactive first-run wizard
hermes model          # pick your model/provider
hermes doctor         # health check
```

The wizard walks you through selecting a gateway platform. I picked **Discord** — that's where the rest of this guide picks up.

---

## Step 2 — Create the Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and sign in.
2. Click **New Application**, give it a name (e.g. "Hermes Agent"), accept the Developer Terms of Service.
3. Note the **Application ID** — you'll need it for the invite URL.

### Create the Bot

1. In the left sidebar, click **Bot**. Discord creates a bot user automatically.
2. Under **Authorization Flow**:
   - **Public Bot**: ON (required for the Discord-provided invite link)
   - **Require OAuth2 Code Grant**: OFF

You can set a custom avatar and banner here — this is what users see in Discord.

### Enable Privileged Gateway Intents (Critical)

Scroll to **Privileged Gateway Intents** and enable **both** of these:

| Intent | Required? | Why |
|---|---|---|
| **Server Members Intent** | Yes | Resolves usernames, checks allowed users list |
| **Message Content Intent** | Yes | Reads message text — without this, the bot sees empty messages |

This is the #1 reason Discord bots fail silently. Without Message Content Intent, the bot comes online but literally cannot read what you type. If your bot is online but never responds, check this first.

If your bot is in fewer than 100 servers, you can toggle intents freely. At 100+ servers, Discord requires verification to use privileged intents — not a concern for personal use.

### Get the Bot Token

Under the **Token** section, click **Reset Token**, enter your 2FA code if prompted, and copy the token immediately. It's shown only once — lose it and you need to generate a new one. Store it in a password manager.

---

## Step 3 — Invite the Bot to Your Server

### Option A — Installation Tab (Recommended)

1. Left sidebar → **Installation**.
2. Enable **Guild Install** under Installation Contexts.
3. For **Install Link**, select **Discord Provided Link**.
4. Under Default Install Settings for Guild Install:
   - **Scopes**: `bot` and `applications.commands`
   - **Permissions**: View Channels, Send Messages, Embed Links, Attach Files, Read Message History, Send Messages in Threads, Add Reactions

### Option B — Manual URL

```
https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot+applications.commands&permissions=27481728282912
```

Replace `YOUR_APP_ID` with your Application ID. The permissions integer `27481728282912` covers the recommended set.

### Required Permissions

At minimum the bot needs:
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History

Recommended additions: Send Messages in Threads, Add Reactions.

### Authorize

Open the URL in a browser, select your server, click **Continue**, then **Authorize**. Complete the CAPTCHA if prompted. You need the **Manage Server** permission on the server to invite bots.

The bot will appear in your server's member list — offline until you start the Hermes gateway.

---

## Step 4 — Get Your Discord User ID

Hermes uses your Discord User ID for the allowlist.

1. Discord **Settings → Advanced → Developer Mode = ON**
2. Right-click your username → **Copy User ID**

It's a long number like `2841320234583714496`. Developer Mode also lets you copy Channel IDs and Server IDs the same way.

---

## Step 5 — Configure Hermes

### Option A — Interactive Setup (Recommended)

```bash
hermes gateway setup
```

Select Discord when prompted, paste your bot token and user ID.

### Option B — Manual Configuration

Add to `~/.hermes/.env`:

```bash
# Required
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_ALLOWED_USERS=23184102545556496

# Multiple allowed users (comma-separated)
# DISCORD_ALLOWED_USERS=23184102545556496,1987321321098237543

# Or use role IDs instead of individual users
# DISCORD_ALLOWED_ROLES=12372722618125678
```

Then start the gateway:

```bash
hermes gateway
```

The bot should come online in Discord within a few seconds.

---

## Step 6 — Authorize the Bot for DMs

This is the step that tripped me up. The bot worked perfectly in-server — responding to mentions, running slash commands, everything — but DMs failed with:

> "Your message could not be delivered."
> "You must share a guild with DMs enabled or add this application to your account to use this command."

After some investigation, the issue was that Discord treats **in-server access** and **DM access** as separate authorizations. The guild invite covers the server, but the bot application needs to be explicitly authorized on your account for DMs.

### The Fix

1. In Discord, go to **User Settings → Authorized Apps** (or search "Authorized Apps" in settings).
2. Find your Hermes bot application in the list.
3. Click **Add App** / **Install** and authorize it — choose "everywhere" rather than limiting it to a specific server.

Once the application is authorized globally on your account, DMs work. This is a one-time step per account. If you ever remove and re-add the bot to a server, you may need to re-authorize.

---

## Step 7 — Verify Everything Works

### Test 1 — Bot is online
Check the member list in your server. The bot should show as online (green dot).

### Test 2 — In-server interaction
Mention the bot in a channel: `@Hermes hello`. It should respond.

### Test 3 — Slash commands
Type `/` in Discord and confirm Hermes commands appear (`/help`, `/whoami`, etc.).

### Test 4 — DM the bot
Open a DM with the bot from the server member list and send a message. It should respond.

### Test 5 — Check `/whoami`
From any platform, `/whoami` shows your access tier (admin/user) and available commands.

### Test 6 — Gateway logs
If anything behaves oddly, watch the gateway output:

```bash
hermes gateway status
# or tail the logs
tail -f ~/.hermes/logs/*.log
```

---

## Step 8 — Make It Persistent (systemd)

For a VPS, you want the gateway running as a service, not a terminal that needs to stay open.

```bash
hermes gateway install   # install as user service
hermes gateway start
hermes gateway status

# View logs
journalctl --user -u hermes-gateway -f

# Enable lingering (keeps running after SSH logout)
sudo loginctl enable-linger $USER
```

For a system-wide service (runs as your user but at boot):

```bash
sudo hermes gateway install --system
sudo hermes gateway start --system
sudo hermes gateway status --system
journalctl -u hermes-gateway -f
```

---

## Configuration Reference

Discord behavior is controlled by two files: `~/.hermes/.env` for credentials and env-level toggles, and `~/.hermes/config.yaml` for structured settings. Environment variables take precedence over config.yaml.

### Key Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DISCORD_BOT_TOKEN` | Yes | Bot token from Developer Portal |
| `DISCORD_ALLOWED_USERS` | Conditional | Comma-separated user IDs allowed to interact |
| `DISCORD_ALLOWED_ROLES` | No | Comma-separated role IDs (auto-enables Server Members Intent) |
| `DISCORD_ALLOW_ALL_USERS` | No | Opt-in to allow everyone (default: false) |
| `DISCORD_HOME_CHANNEL` | No | Channel ID for proactive messages (cron, reminders) |
| `DISCORD_REQUIRE_MENTION` | No | Bot only responds when @mentioned in servers (default: true) |
| `DISCORD_FREE_RESPONSE_CHANNELS` | No | Channel IDs where bot responds without @mention |
| `DISCORD_AUTO_THREAD` | No | Auto-create threads for @mentions (default: true) |
| `DISCORD_IGNORED_CHANNELS` | No | Channels where bot never responds |
| `DISCORD_ALLOWED_CHANNELS` | No | Whitelist — bot only responds in these channels |
| `DISCORD_HISTORY_BACKFILL` | No | Prepend recent scrollback to recover context (default: true) |

### Config.yaml Settings

WebSocket health thresholds (non-secret):

```yaml
discord:
  websocket_liveness_interval_seconds: 15
  websocket_liveness_failure_threshold: 2
  websocket_heartbeat_ack_max_age_seconds: 60
  websocket_max_latency_seconds: 30
```

Session model:

```yaml
group_sessions_per_user: true   # each user gets their own session in shared channels
```

Set to `false` for one shared conversation per channel — useful for a collaborative room, but users share context and token costs.

---

## How Hermes Behaves on Discord

| Context | Behavior |
|---|---|
| **DMs** | Responds to every message. No @mention needed. Each DM has its own session. |
| **Server channels** | By default, only responds when @mentioned. |
| **Free-response channels** | Channels listed in `DISCORD_FREE_RESPONSE_CHANNELS` respond without @mention. |
| **Threads** | Replies in the same thread. Mention rules apply unless the thread/channel is free-response. |
| **Shared channels, multiple users** | By default, isolates session history per user. Two people in `#general` don't share a transcript. |
| **Messages @mentioning others but not the bot** | By default (`DISCORD_IGNORE_NO_MENTION=true`), Hermes stays silent — prevents jumping into conversations directed at other people. |

---

## What You Can Do With the Bot

Once it's running, the bot is a full AI agent with tool access — not just a chatbot. Anything you can do in the Hermes CLI you can mostly do through Discord too.

### Day-to-day capabilities

- **Chat and question-answering** — research, explain concepts, summarize pasted URLs
- **Terminal access** — run shell commands and scripts through chat (with approval modes for dangerous commands)
- **File operations** — read, write, and patch files; handles PDFs, Office docs, code, and more
- **Web search and extraction** — look things up, summarize web pages from URLs
- **Slash commands** — `/help`, `/whoami`, model switching, and skill-specific commands
- **Skills system** — ~90 bundled skills covering YouTube transcripts, Reddit, GitHub, email, Google Workspace (Gmail/Calendar/Drive/Sheets/Docs), Airtable, Notion, PDF, DOCX, XLSX, PowerPoint, and more
- **Background tasks** — long-running jobs that don't block the chat, with configurable notifications
- **Cron / scheduled jobs** — recurring tasks like price monitoring or daily reports
- **Sessions and memory** — persistent conversation context, cross-session memory (MEMORY.md style)
- **Multi-agent / bot mode** — create named bots with different roles, models, and memory that can collaborate

### Things that need setup first

| Capability | What to do |
|---|---|
| Platform integrations (Gmail, GitHub, Notion, etc.) | Install/configure the relevant skill + authentication |
| Model switching | Configure providers in config.yaml / .env |
| Proactive bot messages (reminders, cron output) | Set `DISCORD_HOME_CHANNEL` to a channel ID |
| Mention-free channels | Set `DISCORD_FREE_RESPONSE_CHANNELS` or `DISCORD_REQUIRE_MENTION=false` |
| Voice messages | Discord voice support exists but may need extra configuration |
| Full terminal freedom | Adjust approval/permission settings |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Bot online but never responds | Message Content Intent is OFF | Developer Portal → Bot → Privileged Gateway Intents → enable it → Save |
| "PrivilegedIntentsRequired" error on startup | Same as above | Enable Server Members + Message Content intents |
| Bot ignores you / "User not allowed" | Your user ID missing from allowlist | Add to `DISCORD_ALLOWED_USERS` in .env |
| Bot can't see messages in a channel | Channel permissions insufficient | Grant View Channels + Read Message History |
| Bot is offline | Gateway not running | `hermes gateway` or `hermes gateway start` |
| DMs fail with "could not be delivered" | Application not authorized for DMs on your account | Authorize the app globally in Discord Authorized Apps |
| DMs fail — "add this application to your account" | Same as above | Re-authorize via OAuth2 URL or Authorized Apps settings |
| Bot responds in DMs but not server channels | Default mention behavior | Either @mention the bot, or set `DISCORD_REQUIRE_MENTION=false`, or add channels to `DISCORD_FREE_RESPONSE_CHANNELS` |
| People in same channel share context unexpectedly | `group_sessions_per_user` is false | Set `group_sessions_per_user: true` in config.yaml |

---

## Good First Experiments

1. `/help` or ask "what skills do you have?" — see the menu
2. Paste a URL and ask for a summary — tests web extraction
3. "Search for the latest on <topic>" — tests web search
4. "Create a file ~/test-hermes.txt with 'hello from discord'" then confirm it exists — tests file write + terminal
5. "Read ~/test-hermes.txt" — tests file read
6. Try a skill — paste a YouTube link and ask for a summary

---

## Final Thoughts

The setup process is straightforward once you know the pitfalls. The two things that caused me the most friction were:

1. **Privileged Gateway Intents** — if you skip enabling Message Content Intent, the bot silently can't read messages. Check this first if anything goes wrong.
2. **DM authorization** — the bot works in-server but DMs fail until you authorize the application globally on your Discord account.

After those two are sorted, the gateway just runs. The systemd service keeps it alive across SSH sessions, and the bot becomes a persistent AI assistant available through Discord wherever you are.

For more detail, the [Hermes Agent documentation](https://hermes-agent.nousresearch.com/docs/) covers every configuration option, platform, and feature in depth.

---

*Setup completed: September 2026*
*Hermes Agent version: latest (installed via official installer)*
*Platform: Cloud VPS (Linux)*
*Gateway: Discord bot*
