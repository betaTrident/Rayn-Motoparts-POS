import { execSync } from 'child_process';
import { resolve } from 'path';

const projectDir = '/vercel/share/v0-project';

try {
  console.log('[v0] Current working directory:', projectDir);
  
  // Stage all changes
  console.log('[v0] Staging changes...');
  execSync('git', ['add', '.'], { cwd: projectDir, stdio: 'inherit' });
  
  // Create commit with detailed message
  const commitMessage = `refactor(dashboard): modernize UI with soft neutral aesthetic

This commit implements a comprehensive dashboard redesign focused on creating a modern,
professional SaaS aesthetic. The updates include:

Visual Improvements:
- KPI Cards: Elevated design with gradient backgrounds, improved icon treatment, and refined typography
- Header Controls: Softer appearance with gradient backgrounds and better spacing between controls
- Sidebar Navigation: Refined borders, improved hover states, and softer active state styling
- App Header: Enhanced input styling, better button transitions, and refined color palette
- Charts Section: Modern card styling with subtle shadows and gradient backgrounds
- Base Card Component: Added smooth transitions and consistent border styling

Design Principles Applied:
- Whitespace-focused layouts with improved breathing room
- Rounded corners (rounded-lg) for softer edges throughout
- Soft color palette using slate grays (100, 200, 500, 600, 900)
- Smooth transitions and hover effects for better interactivity
- Clear typography hierarchy with improved font weights and sizes
- Micro-interactions with shadow and scale effects

All changes maintain the existing functionality while improving visual presentation
and user experience consistency across the dashboard.`;
  
  console.log('[v0] Creating commit...');
  execSync('git', ['commit', '-m', commitMessage], { cwd: projectDir, stdio: 'inherit' });
  
  console.log('[v0] Commit successful!');
  process.exit(0);
} catch (error) {
  console.error('[v0] Git operation failed:', error.message);
  process.exit(1);
}
