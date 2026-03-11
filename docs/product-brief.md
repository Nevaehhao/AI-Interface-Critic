# Product Brief

## One-line definition

AI Interface Critic is an open-source app that reviews UI screenshots like a senior product designer and produces an implementation-ready handoff for engineers.

## Primary users

- Designers who want faster pre-review feedback
- Front-end engineers who want structured UI improvement plans
- Builders who want to connect their own model provider, app URL, and repository context

## Problem

Most AI UI review tools either stop at vague critique or jump straight into code-generation claims without a trustworthy handoff layer. Teams need something in between: a structured review that is useful to both design and engineering.

## Product outcome

The product should turn one screenshot plus optional product and repo context into:

- A credible UI/UX review
- A clear prioritization of what to fix
- A builder brief that can be handed to a developer or coding agent

## Core loop

1. Upload a screenshot
2. Attach page URL, repo URL, and product context when available
3. Run critique with a user-configured AI provider
4. Review the report and mapped issues
5. Copy the builder handoff into an engineering workflow

## Current scope

- Screenshot upload with validation and preview
- Bring-your-own model provider support
- Structured report with section scores and screenshot highlights
- Builder handoff with front-end, back-end, risk, and acceptance criteria sections
- Local history, optional Neon persistence, workspaces, and PDF export

## Non-goals right now

- Proprietary hosted model billing
- Real-time multiplayer editing
- Full browser automation of repository changes from the web app alone

## Success criteria

- A first-time open-source user can run the app with their own model in minutes
- The critique feels more like a senior review than raw model output
- The builder handoff is concrete enough to guide real implementation work
