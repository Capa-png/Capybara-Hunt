#!/usr/bin/env python3
import subprocess
import json
import os
import sys
from pathlib import Path

# Git credentials
GITHUB_USER = "SocoHoko"
GITHUB_TOKEN = "YOUR_GITHUB_TOKEN_HERE"  # Replace with your token
REPO_NAME = "capybara-hunt"
WORK_DIR = Path(__file__).parent

def run(cmd, check=True):
    """Run shell command"""
    print(f"🔧 {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=WORK_DIR, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if check and result.returncode != 0:
        raise Exception(f"Command failed: {cmd}")
    return result

def main():
    print("📦 Publishing Capybara Hunt to GitHub...\n")
    
    # Configure git
    run(f'git config --global user.name "{GITHUB_USER}"')
    run(f'git config --global user.email "noreply@github.com"')
    
    # Initialize repo if needed
    if not (WORK_DIR / '.git').exists():
        print("\n🔨 Initializing git repository...")
        run('git init')
        run('git add .')
        run('git commit -m "Initial commit: Capybara Hunt Game"')
    
    # Check for remote
    result = run('git remote -v', check=False)
    if 'origin' not in result.stdout:
        print("\n🔗 Adding remote origin...")
        repo_url = f"https://{GITHUB_USER}:{GITHUB_TOKEN}@github.com/{GITHUB_USER}/{REPO_NAME}.git"
        run(f'git remote add origin {repo_url}')
    
    # Check if main branch exists, if not rename master
    result = run('git branch', check=False)
    if 'main' not in result.stdout:
        print("\n🌿 Renaming branch to main...")
        run('git branch -M main', check=False)
    
    # Push to GitHub
    print("\n⬆️  Pushing to GitHub...")
    repo_url = f"https://{GITHUB_USER}:{GITHUB_TOKEN}@github.com/{GITHUB_USER}/{REPO_NAME}.git"
    run(f'git push -u origin main')
    
    print("\n✅ Successfully published to GitHub!")
    print(f"📱 Repository: https://github.com/{GITHUB_USER}/{REPO_NAME}")
    print(f"🌐 GitHub Pages: https://{GITHUB_USER.lower()}.github.io/{REPO_NAME}/")
    print("\n⚠️  Next steps:")
    print(f"1. Go to: https://github.com/{GITHUB_USER}/{REPO_NAME}/settings/pages")
    print("2. Under 'Source', select 'Deploy from a branch'")
    print("3. Choose 'main' branch and '/ (root)' folder")
    print("4. Click 'Save'")
    print("5. Wait 1-2 minutes for deployment")
    print(f"6. Visit: https://{GITHUB_USER.lower()}.github.io/{REPO_NAME}/")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
