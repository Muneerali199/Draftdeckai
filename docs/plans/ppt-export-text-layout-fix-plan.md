# PPT Export Text Layout Fix Plan

Branch: `muneer-working`
Plan Date: Monday, February 16, 2026
Execution Date: Tuesday, February 17, 2026

## Goal
Fix mismatch between editor preview and exported PPT where text is clipped or leaves excessive unused left space in export.

## Success Criteria
- Exported PPT text block width/position matches on-screen slide layout within acceptable tolerance.
- No clipped title/body/bullets in normal deck sizes (6-12 slides).
- Left/right padding is visually balanced across themes.
- Works for both short and content-heavy slides.

## Root-Cause Hypotheses
1. PPT text box width/margins are not aligned with web slide content container.
2. Export font metrics differ from browser render metrics.
3. Line-height and wrapping rules differ between HTML preview and PPTX text runs.
4. Hardcoded image/chart regions reduce text area without adaptive reflow.

## Tomorrow Implementation Plan

### 1. Reproduce + Measure (High Priority)
- Create 3 controlled sample decks: short text, long bullet slides, mixed visuals.
- Capture exact text container values in preview (x, y, width, height, padding).
- Capture current PPT export shape values and compare.
- Document mismatch table per slide type.

### 2. Define Layout Parity Contract
- Introduce one source of truth for slide safe-area and text-region tokens.
- Standardize spacing variables for:
  - title region
  - subtitle/body region
  - bullet region
  - visual region
- Ensure preview and export both read from same token map.

### 3. Fix PPT Text Box Geometry
- Replace ad-hoc text box coordinates with token-driven coordinates.
- Remove excess left margin in PPT text shapes.
- Set consistent internal margins (`lIns`, `rIns`, `tIns`, `bIns`) based on preview spacing.
- Use dynamic width calculation when image/chart block exists.

### 4. Text Fit + Wrapping Strategy
- Add text-fit utility for export:
  - estimate line count by font size and box width
  - downscale font with min threshold if overflow predicted
  - increase box height / shift following blocks when needed
- Ensure bullet indentation and hanging values match preview rhythm.

### 5. Theme + Font Consistency
- Lock export font family/weight to selected presentation theme.
- Normalize line-height/paragraph spacing to reduce browser-vs-PPT drift.
- Validate both light and dark themes for spacing parity.

### 6. Validation + Guardrails
- Add export regression checks for representative slide types.
- Add a quick script/checklist to compare preview container and export coordinates.
- Manual QA pass:
  - 6-slide deck
  - 12-slide deck
  - heavy-bullet deck
  - chart/image mixed deck

## Deliverables (End of Tomorrow)
- Coordinate/token refactor for export layout.
- Text-fit utility in export pipeline.
- Updated PPT export implementation with improved spacing.
- Test notes with before/after screenshots and mismatch table.

## Risks
- Font availability differences between runtime and PPT client can still shift wraps.
- Some slide types may require per-layout overrides after base fix.

## Fallback Strategy
If full parity is not reached tomorrow:
- Ship tokenized geometry + no-clipping guarantee first.
- Follow up with pixel-precision parity as phase 2.
