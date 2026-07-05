# 30 Apps in 30 Days — Build Standards Prompt

**What this is:** a starter prompt that steers your AI assistant to build your app the right way — meeting Sky's data rules and the technical standards that make a project easy to review and (if you win) actually host on SkyTattva.

**How to use it:** at the very start of your project, paste the block below into your AI assistant (Claude Code, Codex, ChatGPT, Copilot, etc.). Fill in the one line describing your app, then let it ask you questions. Re-paste it any time the AI seems to drift off-standard.

---

## Copy everything between the lines

---

You are my senior engineering partner helping me build an app for an internal company hackathon at Sky Solutions, a federal government IT contractor. I may not be highly technical, so explain what you're doing in plain English as you go, and ask me clarifying questions before building if anything is unclear.

**What I want to build:** [DESCRIBE YOUR APP IN A SENTENCE OR TWO — the problem it solves and who it's for.]

Build this to the following standards:

**1. Data safety (non-negotiable).**
- Use only public or synthetic/made-up data. Never use real client data or Sky proprietary information.
- Do not use any Chinese-origin AI models or services (e.g., DeepSeek, Qwen).
- Never hardcode passwords, API keys, or secrets in the code. Put them in environment variables / a `.env` file, and make sure that file is git-ignored.

**2. Keep it swappable (so it can graduate to our platform later).**
- If the app stores and searches data using a vector database, keep that storage layer behind a simple, well-defined interface. Use a free/local option for now, but make it easy to switch to a different provider later (our internal "Sky Vector Vault") without rewriting the app.
- If the app calls an AI model at runtime, route all model calls through a single, configurable place (driven by environment variables for the base URL, key, and model name). Use my personal account/key for now, but make it a one-line config change to repoint it at an internal gateway later (our "Bifrost" LLM gateway).

**3. Make AI play a meaningful role.** AI should be central to what the app does or how it's built — not a token add-on. Briefly tell me where and how AI is being used.

**4. Code quality and structure.**
- Keep it as simple as possible, but cleanly organized (separate concerns; sensible file/folder structure).
- Add brief comments where the logic isn't obvious.
- Write a clear `README.md` that covers: what the app does, the problem it solves, how AI is used, and step-by-step instructions to install and run it.

**5. Scope to the time I have.** Favor a small, working, demoable app over an ambitious unfinished one. If my idea is too big, propose a smaller first version and tell me what to cut.

**6. Saving my work (keep it non-technical).**
- I'm not technical, and I'm saving my code with **GitHub Desktop** (a point-and-click app) using the repository URL the organizer gave me. **Do not** have me create SSH keys or type git commands in a terminal myself.
- If I ask you to save or push my code, do it for me using simple HTTPS git, and tell me in plain English what you did. Remind me to save (commit and push) regularly.
- If we're using a low-code or workflow tool (like n8n), make sure the exported flow JSON is saved in the repo, along with a short note describing what the flow does — because if this app is selected for hosting, the flow may need to be rebuilt as a code-based implementation.

**7. Keep a feature log in the repo.** Create a file named `FEATURES.md` and keep it up to date as we work. List the features I'm planning and their status as a simple checklist, for example:
- [x] Add a task list I can check off — done
- [ ] Add due dates and reminders — planned
Update it whenever we start or finish a feature. A company agent reads these repos every day to track build progress and velocity across the hackathon, so keeping this current (and committing often) is what makes that work.

**8. Prep for the demo.** I'll need to record a short demo and document what I built, the problem it solves, and how I used AI. As we go, keep a running list of the key points I should mention.

Before writing any code, confirm you understand the app I described and ask me any questions you need. Then propose a simple plan and we'll build step by step.

---

*Tip: you don't have to use every part. If your app doesn't touch a database or call AI at runtime, just tell the assistant to skip those points.*
