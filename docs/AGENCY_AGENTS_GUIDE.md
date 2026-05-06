# 🤖 The Agency Agents - Workflow Guide

This guide explains how your AI specialist team (`agency-agents`) is integrated into your workflow for the **Rayn-Motoparts-POS** project, and how you can use them to elevate your codebase, design, and architecture.

## 🚀 How It Works
We have installed the 156+ specialized agents from your `agency-agents` workspace directly into your local AI environment (as **Antigravity Skills**). 

This means you have an entire virtual agency of experts at your fingertips. Instead of just talking to a general AI assistant, you can tag a specific "expert" in your chat prompt, and the AI will take on that persona, adopting their specific workflow, quality standards, and deep domain knowledge.

## 🎯 How to Use Your Agents
To use an agent, simply mention them in the chat using the `@` symbol followed by their title.

**Syntax:**
`@agency-<role-name> <your request>`

### 🛠️ Core POS Squad (Most Useful Agents for this Project)

Here are the most powerful agents you'll likely use for the POS system:

#### 1. Frontend & Code Quality
- **`@agency-frontend-developer`**
  - **Use When:** You are building React components, writing hooks, or need UI performance optimizations.
  - **Example:** *"@agency-frontend-developer please review `InventoryStockTable.tsx` and optimize it for React best practices."*
- **`@agency-code-reviewer`**
  - **Use When:** You've finished a feature and want a strict, constructive review before considering it "done".
  - **Example:** *"@agency-code-reviewer review the recent changes in `AppHeader.tsx` for any potential bugs or anti-patterns."*
- **`@agency-senior-developer`**
  - **Use When:** You are tackling complex state management or advanced component architecture.
  - **Example:** *"@agency-senior-developer help me refactor the global state management for the user cart."*

#### 2. UI/UX & Design
- **`@agency-ui-designer`**
  - **Use When:** You need help maintaining the "Industrial Atelier" aesthetic and ensuring visual consistency across modules.
  - **Example:** *"@agency-ui-designer review our `NotFoundPage.tsx` and suggest a design that fits our Industrial Atelier theme."*
- **`@agency-ux-architect`**
  - **Use When:** You need to structure complex layouts, user flows, or responsive designs.
  - **Example:** *"@agency-ux-architect help me restructure the layout of `KpiSummaryCards.tsx` to be more intuitive on mobile devices."*

#### 3. Architecture & Planning
- **`@agency-backend-architect`**
  - **Use When:** Designing data shapes, API interactions, or database schemas.
  - **Example:** *"@agency-backend-architect I need to design the data model for the transaction history feature."*
- **`@agency-reality-checker`**
  - **Use When:** You are preparing for a release or want to ensure a feature is truly production-ready.
  - **Example:** *"@agency-reality-checker review our entire POS module structure for any missing quality gates."*
- **`@agency-sprint-prioritizer`**
  - **Use When:** You have a lot of tasks and need help organizing them into a structured sprint plan.

## 💡 Best Practices

1. **Be Specific:** Tell the agent exactly which files to look at. (e.g., *"Review `docs/frontend/react-child-error-fix-plan.md`"*)
2. **Combine Agents in Sequence:** For a major feature, you can use multiple agents in steps.
   - *Step 1:* Ask `@agency-ux-architect` to design the flow.
   - *Step 2:* Ask `@agency-ui-designer` to plan the styling.
   - *Step 3:* Ask `@agency-frontend-developer` to write the code.
   - *Step 4:* Ask `@agency-code-reviewer` to check the code.
3. **Trust their Expertise:** Each agent has specific rules they follow (like a real expert). If an agent says something needs to be fixed before moving on, it's usually because it violates their domain's best practices!

---
*Note: The agents are powered by your local Gemini Antigravity installation and pull from your `k:\agency-agents` repository schemas.*
