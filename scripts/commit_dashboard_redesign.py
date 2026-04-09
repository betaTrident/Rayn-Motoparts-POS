#!/usr/bin/env python3
import subprocess
import sys

def run_command(cmd):
    """Run a shell command and return the result."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

try:
    # Change to project directory
    import os
    os.chdir('/vercel/share/v0-project')
    
    # Stage all changes
    print("[v0] Staging all changes...")
    run_command("git add -A")
    
    # Commit with detailed message
    commit_message = """refactor: modernize dashboard with soft design aesthetic

- Upgrade KPI cards with elevated design, gradient backgrounds, and refined icon treatment
- Refine header controls with improved spacing and softer visual hierarchy
- Transform sidebar navigation with softer borders, rounded corners, and subtle active states
- Enhance app header with refined buttons, improved search styling, and better spacing
- Update chart sections with modern card styling and improved visual consistency
- Apply subtle shadows, smooth transitions, and whitespace-focused design across all components
- Maintain all functionality while improving visual polish and user experience"""
    
    print("[v0] Committing changes...")
    run_command(f'git commit -m "{commit_message}"')
    
    print("[v0] Dashboard redesign successfully committed!")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
