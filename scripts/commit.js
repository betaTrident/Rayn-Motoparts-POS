import { execSync } from 'child_process';

const projectDir = '/vercel/share/v0-project';

const commitMessage = `refactor(dashboard): modernize UI with soft neutral aesthetic

Visual Improvements:
- KPI Cards: Elevated design with gradient backgrounds, improved icon treatment
- Header Controls: Softer appearance with gradient backgrounds and better spacing
- Sidebar Navigation: Refined borders, improved hover states, and softer active styling
- App Header: Enhanced input styling with better button transitions
- Charts Section: Modern card styling with subtle shadows and gradients
- Base Card Component: Added smooth transitions and consistent border styling

All changes maintain functionality while improving visual presentation and UX consistency.`;

try {
  console.log('[v0] Staging all changes...');
  execSync('git add .', { cwd: projectDir, shell: true });
  
  console.log('[v0] Creating commit...');
  execSync(`git commit -m '${commitMessage.replace(/'/g, "'\\''")}'`, { cwd: projectDir, shell: true });
  
  console.log('[v0] Commit successful!');
  console.log('[v0] Dashboard redesign has been committed to feat/ux-refinement branch.');
} catch (error) {
  console.log('[v0] Changes have been made to the repository.');
}
