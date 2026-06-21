<!-- dkmt:deep-breathing:start -->
# Deep Breathing Exercises

Deep Breathing Exercises — Guided breathing exercises web app

## Command Center

| Endpoint | URL |
|----------|-----|
| Plugin | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/plugin` |
| Briefing | `https://commandcenter.darkmatter.is/api/v1/context/deep-breathing/briefing` |
| Notes | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/notes` |
| Secrets | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/env` |
| API spec | `https://commandcenter.darkmatter.is/api/v1/openapi` |

Auth: `Authorization: Bearer $DKMT_CC_KEY`

## Environments

- **production** (domain): https://deepbreathingexercises.com
- **production** (app): https://origin.deepbreathingexercises.com

## CLI Quick Reference

The `dkmt-cc` CLI is installed via:
```
curl -fsSL https://raw.githubusercontent.com/Darkmatter-AI/deploy-dashboard/main/scripts/install-dkmt-cc.sh | bash
```

| Command | What it does |
|---------|-------------|
| `dkmt-cc context deep-breathing` | Full project context |
| `dkmt-cc env deep-breathing --export` | Resolve secrets as env vars |
| `dkmt-cc note deep-breathing "text"` | Add a note |
| `dkmt-cc access list deep-breathing` | See who has access |
| `dkmt-cc projects` | List all projects |
| `dkmt-cc whoami` | Check current user |
<!-- dkmt:deep-breathing:end -->

# Deep Breathing Exercises — Command Center

This project is registered in the Darkmatter Command Center as **deep-breathing**.

## Command Center

| Endpoint | URL |
|----------|-----|
| Plugin | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/plugin` |
| Briefing | `https://commandcenter.darkmatter.is/api/v1/context/deep-breathing/briefing` |
| Notes | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/notes` |
| Secrets | `https://commandcenter.darkmatter.is/api/v1/projects/deep-breathing/env` |
| API spec | `https://commandcenter.darkmatter.is/api/v1/openapi` |

Auth: `Authorization: Bearer $DKMT_CC_KEY`

## CLI Quick Reference

| Command | What it does |
|---------|-------------|
| `dkmt-cc status deep-breathing` | Project dashboard |
| `dkmt-cc context deep-breathing` | Full project context |
| `dkmt-cc env deep-breathing --export` | Resolve secrets as env vars |
| `dkmt-cc note deep-breathing "text"` | Add a note |
| `dkmt-cc pm deep-breathing` | PM digest (Linear + commits) |
| `dkmt-cc whoami` | Check current user |
