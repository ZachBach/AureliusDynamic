---
name: triage-nda
description: Triage inbound NDAs — scan connected sources for new NDA requests, extract and classify key terms against standard positions, flag risky clauses, and recommend routing (sign as-is, redline, or escalate). Use when NDAs arrive by email or CLM and need a first-pass review, when a specific NDA file needs analysis, or when you want the current state of the NDA queue.
argument-hint: "[inbox | <file-or-link> | status]"
---

# /triage-nda -- NDA Intake & Triage

> Standalone install (no CONNECTORS.md): before scanning, check which data sources are actually connected — MCP connectors that are not authorized (e.g. Gmail via claude.ai connector settings) must be listed under "Sources Not Available" rather than silently skipped.

First-pass review of incoming NDAs: identify what arrived, extract the terms that matter, compare them to standard positions, and route each agreement to the right disposition.

**Important**: This command assists with legal workflows but does not provide legal advice. Triage output is a first pass to prioritize attorney attention — every routing recommendation must be reviewed by a qualified legal professional before anything is signed or sent.

## Invocation

```
/triage-nda               # Same as inbox: find and triage pending NDAs
/triage-nda inbox         # Scan connected sources for new/pending NDAs
/triage-nda <file-or-link>  # Triage one specific NDA document
/triage-nda status        # Show the current NDA queue and dispositions
```

## Modes

---

### Inbox Triage

Find every NDA awaiting action and produce a triage card for each.

#### Sources to Scan

**Email (if connected):**
- Inbound NDA requests and attached/linked agreements
- Counterparty responses to previously sent drafts or redlines
- Internal requests to "get an NDA in place" (which need the company template sent, not review)

**CLM (if connected):**
- NDAs in draft, in review, or awaiting signature
- Recently executed NDAs (for the status view)

**Chat (if connected):**
- Requests for NDA review or status in legal channels
- Escalations about stalled NDAs blocking a deal

**Documents (if connected):**
- The company's NDA playbook and standard template — load this first if it exists; playbook positions override the generic defaults below

#### Workflow

1. Collect candidate NDAs from the sources above; deduplicate against anything already triaged
2. For each NDA, run the Term Extraction and Risk Classification below
3. Sort the queue: Red items first, then Yellow, then Green
4. Output one triage card per NDA plus the queue summary

---

### Single-Document Triage

The user provides a file path, attachment, or link. Read the document, run Term Extraction and Risk Classification, and output one full triage card. If the company playbook or standard template is available in connected documents, diff against it and cite the specific playbook position for each flag.

---

### Term Extraction

For every NDA, identify:

- **Parties and direction**: mutual or one-way; if one-way, which way the obligations run
- **Business context**: sales discussion, vendor evaluation, partnership, M&A, employment — context changes what terms are acceptable
- **Definition of Confidential Information**: marked-only vs. broad; carve-outs present (independently developed, publicly known, rightfully received, required disclosure)
- **Term and survival**: agreement duration, confidentiality survival period, and whether trade secrets survive indefinitely
- **Governing law and venue**: jurisdiction, and whether it matches standard positions
- **Riders that don't belong in an NDA**: non-solicitation, non-compete, IP assignment or license grants, exclusivity — flag every one
- **Residuals clause**: presence and breadth
- **Remedies**: injunctive relief language, indemnification, liquidated damages
- **Mechanics**: assignment restrictions, notice requirements, counterparts/e-signature, return-or-destroy obligations

### Risk Classification

Classify each NDA using the playbook if available; otherwise these defaults:

- **🟢 Green — sign as-is**: mutual, standard carve-outs, reasonable term (1–5 years confidentiality), no riders, acceptable governing law
- **🟡 Yellow — minor redlines**: fixable deviations (one-way where mutual is warranted, missing carve-outs, overlong survival, unfavorable but negotiable venue); list the specific redlines
- **🔴 Red — escalate to counsel**: non-compete or IP assignment riders, indefinite obligations on broad definitions, liquidated damages, indemnification beyond confidentiality breach, M&A context, or anything the playbook marks as a walk-away

#### Output Format

```
## NDA Triage -- [Date]

### Queue Summary
[N] NDAs pending: [x] 🔴 escalate · [y] 🟡 redline · [z] 🟢 sign as-is

---

### 🔴 [Counterparty] — [context]
**Received**: [date, source]  ·  **Direction**: [mutual/one-way]
**Flags**:
- [Clause]: [what it says] → [why it's a problem / playbook position]
**Recommended routing**: [escalate to counsel / specific action]
**Suggested reply**: [one-line status the requester can be given]

[...one card per NDA, Red first...]

### Sources Not Available
[Any sources that were not connected or returned errors]
```

---

### Status

Summarize the queue without re-triaging: counts by disposition, oldest pending item, anything blocking a deal (per chat/CRM context), and NDAs sent to counterparties awaiting response.

## General Notes

- Never draft or send redlines automatically — propose them; a human sends them
- If the company template exists, prefer "send our template" over redlining theirs when the relationship allows it
- Track recurring counterparty pushback; suggest playbook updates when the same redline appears repeatedly
- Note privilege: triage cards prepared for counsel review may warrant work-product marking
- Keep cards short — every flag needs a clause citation and a next step, nothing else
