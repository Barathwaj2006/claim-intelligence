# Palette's Journal - Critical Learnings

## 2026-09-03 - Accessible Toggle Filter Buttons
**Learning:** Filter button groups that visually toggle active state require both `aria-pressed` for screen reader state awareness and `focus-visible:ring-2` for accessible keyboard navigation.
**Action:** When implementing filter toggle buttons in React, ensure `aria-pressed={isActive}` and explicit `aria-label`s are applied to convey action and state to assistive technologies.
