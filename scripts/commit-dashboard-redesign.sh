#!/bin/bash

cd /vercel/share/v0-project

git add -A

git commit -m "refactor: modernize dashboard UI with SaaS aesthetic

- Transform KPI cards with elevated design, gradient backgrounds, and improved icon treatment
- Refine header controls with lighter backgrounds and better spacing
- Update sidebar with softer borders, rounded corners, and refined active states
- Enhance app header with subtle improvements and better focus states
- Modernize charts section with improved card styling and softer grid lines
- Apply consistent design language: soft neutrals, 16px rounded corners, smooth transitions
- Improve visual hierarchy across all dashboard components
- Add hover states and micro-interactions for better UX

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

echo "Changes committed successfully!"
