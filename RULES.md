# Project Rules: CV Tailor

## Model Preferences
- **Gemini Flash 2.5**: Whenever the user references "Gemini Flash 2.5", they mean exactly that version. It is NOT to be confused with 1.5 or 2.0. (Note: Ensure the model string matches the provider's API availability).

## Workflow Rules
- **Git Push**: After every significant change or fix, the code MUST be pushed to GitHub.
- **Agent Logging**: Every change must be documented in detail in `agent.md` to facilitate tracking and follow-up.
- **Lossless Extraction**: Never truncate or summarize user data during CV extraction. Use the "Lossless Metadata Capture" pattern to preserve all unmapped fields.
- **Forgiving Auditing**: When checking for missing fields, search the entire CV context before flagging a gap.
