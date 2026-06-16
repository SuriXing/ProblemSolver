# Agent Notes

## Commit Message Style

Commit messages follow the owner's personal narrative voice — the same one used across the SuriXing repos. Every message opens with **`Today I ...`** and is written in first person.

- **Subject line:** begins with `Today I ...`, says what was done in one flowing sentence.
- **Body:** after a blank line, add paragraphs with the context, the reason, the trade-offs and — where relevant — an honest note about any mistake or regression you hit.
- **No conventional-commit prefixes** (`feat:` / `fix:` / `chore:`), no emoji, no trailing period in the subject.

Example:

```
Today I <subject ...>

<context / rationale / trade-offs>

Honest note: <anything that went wrong or is worth flagging>.
```

This file is tracked, so convention updates land as normal commits with the same `Today I ...` message.
