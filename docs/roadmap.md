# Project Roadmap

## Product statement

AI Interface Critic analyzes UI screenshots and generates structured UX critique for early-stage design review.

## Product goals

- Help users get fast UX feedback without a live reviewer
- Show clear design thinking, not just raw AI output
- Produce a portfolio-quality web app with strong front-end execution

## Non-goals for MVP

- Full design file import from Figma
- Multi-user collaboration
- Real-time editing
- Complex billing or auth

## Primary user

Choose one user to optimize for first:

- Junior designers needing fast critique before review

This keeps the language, feature set, and UI focused.

## Core user flow

1. User lands on the homepage
2. User uploads a UI screenshot
3. App shows a staged analysis loading state
4. App returns a structured critique report
5. User reviews issues and suggested improvements

## Information architecture

The report should be organized into predictable sections:

- Overview
- Visual hierarchy
- Accessibility
- Layout structure
- Interaction clarity
- Suggested improvements

## MVP feature breakdown

### Feature 1: Project scaffold

Goal:
Create a stable Next.js foundation.

Deliverables:

- Next.js app with TypeScript and App Router
- Tailwind setup
- Basic layout and design tokens
- Environment variable support

Definition of done:

- `pnpm dev` or `npm run dev` starts cleanly
- Homepage renders
- Repo has a clean base structure

### Feature 2: Landing page

Goal:
Explain the product clearly and route users into the upload flow.

Deliverables:

- Hero section
- Product explanation
- Sample report preview
- Primary CTA to upload

Definition of done:

- Clear value proposition above the fold
- Mobile and desktop layouts both work

### Feature 3: Upload flow

Goal:
Let the user submit a screenshot with minimal friction.

Deliverables:

- File upload component
- Drag-and-drop or click-to-upload
- File validation
- Preview before submission

Definition of done:

- PNG/JPG upload works
- Invalid file states are handled
- User can move from upload to analysis

### Feature 4: Loading experience

Goal:
Make AI latency feel intentional instead of broken.

Deliverables:

- Dedicated loading screen
- Rotating progress messages
- Clear analysis states such as hierarchy, accessibility, layout

Definition of done:

- Loading UI is visible for async analysis
- State changes are readable and polished

### Feature 5: Report UI with mocked data

Goal:
Finish the front-end information architecture before integrating AI.

Deliverables:

- Report page
- Issue cards
- Section anchors or tabs
- Overall score block

Definition of done:

- Mock JSON can render the full report
- Cards are readable and scannable

### Feature 6: Analysis API contract

Goal:
Define the exact shape of the data before model integration.

Deliverables:

- `POST /api/analyze`
- Shared TypeScript types
- Structured JSON schema for report output
- Server-side validation

Definition of done:

- API returns mocked structured JSON
- Front end consumes typed response cleanly

### Feature 7: OpenAI integration

Goal:
Replace mocked analysis with real model output.

Deliverables:

- Prompt for UX critique
- Image upload handling on server
- OpenAI API call
- JSON response parsing with fallback handling

Definition of done:

- Real screenshot produces a valid report
- Errors and malformed responses are handled

### Feature 8: Persistence

Goal:
Store uploaded analyses for later review.

Deliverables:

- Supabase project setup
- Screenshot metadata storage
- Analysis result storage
- History or recent analyses view

Definition of done:

- A completed analysis can be retrieved later

## Post-MVP features

- Issue highlighting on screenshot
- Category scores and overall UX score
- Redesign suggestions
- Export report as PDF
- Authentication and saved workspaces

## Suggested build sequence

This is the implementation order I recommend:

1. Feature 1: Project scaffold
2. Feature 2: Landing page
3. Feature 3: Upload flow
4. Feature 4: Loading experience
5. Feature 5: Report UI with mocked data
6. Feature 6: Analysis API contract
7. Feature 7: OpenAI integration
8. Feature 8: Persistence

This order keeps UX structure ahead of model integration and avoids building an AI demo without product shape.

## JSON shape to design around

The app should eventually render something close to:

```json
{
  "summary": {
    "overallScore": 78,
    "productType": "marketing landing page",
    "mainFinding": "Primary call-to-action is visually weak."
  },
  "sections": [
    {
      "category": "Visual hierarchy",
      "score": 72,
      "issues": [
        {
          "title": "Primary CTA lacks contrast",
          "severity": "high",
          "description": "The main action blends into nearby elements.",
          "suggestion": "Increase contrast and spacing around the primary action."
        }
      ]
    }
  ]
}
```

## Portfolio angle

To make this strong in a UX or product portfolio, document:

- Problem framing
- User flow
- Information architecture
- Loading state rationale
- Report structure decisions
- Tradeoffs between AI flexibility and structured outputs
- Final implementation details
