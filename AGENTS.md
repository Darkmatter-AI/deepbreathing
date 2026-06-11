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
| `dkmt-cc env deep-breathing` | Where env values live + how to fetch them |
| `dkmt-cc secret get deep-breathing <key> --resolve` | Resolve a registered secret (op://) |
| `dkmt-cc secret list deep-breathing` | List registered secret refs |
| `dkmt-cc note deep-breathing "text"` | Add a note |
| `dkmt-cc pm deep-breathing` | PM digest (Linear + commits) |
| `dkmt-cc whoami` | Check current user |
