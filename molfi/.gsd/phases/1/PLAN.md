---
phase: 1
plan: 1
type: autonomous
autonomous: true
wave: 1
---

# Plan 01-01: MolFi Foundation & Dark Design System

## Objective
Establish the technical and visual foundation for MolFi, creating the "Dark Novel" design system and the core database schema for AI Fund Managers.

## Context
- Project: MolFi (AgentFi Hedge Fund)
- Hackathon Deadline: Feb 15th
- Design: Dark and Novel (Obsidian/Neon)

## Tasks

### 1. Design System Implementation `type:auto`
- Update `src/app/globals.css` with the "Dark Novel" palette and typography.
- Implement base components: `GlassContainer`, `NeonButton`, `StatusBadge`.
- Setup fonts: `Playfair Display` (Headers), `Inter` (Body), `JetBrains Mono` (Data).

### 2. Database Schema (Supabase) `type:auto`
- Generate `molfi_migration.sql` for the hedge fund logic.
- Tables: `FundManager` (The Agent), `Vault` (The Pool), `Deposit`, `Trade`, `Position` (Perps tracking), `ProtocolStats`.
- Relationships: Users back Vaults, Vaults are managed by FundManagers. Positions are opened by Managers.

### 3. Core Protocol Client `type:auto`
- Setup Supabase admin/public clients in `src/lib/supabase.ts`.
- Link to the provided Supabase project.

### 4. Landing Page: The Terminal `type:auto`
- Transform the main landing page into a high-end "AI Fund Terminal".
- Display protocol stats (TVL, Active Agents, Total Yield).

## Verification Criteria
- [ ] CSS variables for Dark/Neon theme are correctly defined.
- [ ] SQL schema covers all Fund/Vault/Trade requirements.
- [ ] Landing page renders with the correct "Dark Novel" aesthetic.

## Success Criteria
- Base infrastructure ready for Agent Strategy implementation in Phase 2.
- Visual "WOW" factor achieved for the project foundation.
