# BUGS.md — Cipher API Bug Tracker

**Scope:** Bugs specific to the Cipher API (`cipher.endpnt.dev`). Cross-cutting bugs live at `../BUGS.md`.

**ID prefix:** `CI-NNN` (sequential, do not reuse).

**Last updated:** 2026-04-28.

---

## Open bugs

*(None — all known bugs resolved.)*

---

## Resolved bugs

### CI-001 — Free-tier rate limit discrepancy: CLAUDE.md said 1,000/month, config enforces 100/month

- **Severity:** Medium
- **Files:** `CLAUDE.md`, `lib/config.ts`
- **Discovered:** 2026-04-24 (biweekly code health audit)
- **Symptom:** `CLAUDE.md` stated: "Free tier is 1,000 operations/month, NOT 100." The actual `lib/config.ts` `TIER_LIMITS.free.requests_per_month` was `100`. These contradicted each other.
- **Root cause:** A false citation in `docs/specs/archive/DONE-CC-SPEC-ADDENDUM.md` (which claimed "Per CC-SPEC.md: 1,000/month") propagated into CLAUDE.md. The original spec actually specifies 100/month.
- **Resolution:** Corrected `CLAUDE.md` to state 100/month with source references. `lib/config.ts`, `web/lib/pricing.ts`, and all cipher UI components were already correct at 100/month — no code changes required.
- **Resolved:** 2026-04-28
- **Resolution commit:** *(to be filled in after push)*

---

## Bug entry template

```markdown
### CI-XXX — [Short descriptive title]

- **Severity:** Critical | High | Medium | Low
- **File:** [path]
- **Discovered:** [YYYY-MM-DD, context]
- **Symptom:** [observable behavior]
- **Root cause:** [best-known explanation]
- **Impact:** [customer/security risk]
- **Fix approach:** [high-level plan]
- **Cross-reference:** [related bugs if any]
- **Status:** Open | In progress | Awaiting deployment
```
