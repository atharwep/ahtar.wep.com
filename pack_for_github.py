import os
import shutil

# --- Configuration ---
SOURCE_DIR = "."
DIST_DIR = "athar_github_v3"
IGNORE_FILES = [
    "bridge_script.js",      # Server side secrets
    "pack_for_github.py",   # This script
    ".env",                # Local environments
    "update_bridge_url.py", # Local helper
    "package-lock.json",    # Not always needed for static deploy
    "server.js"             # Local dev server
]
IGNORE_DIRS = [
    ".git",
    ".agent",
    ".idea",
    "node_modules",
    DIST_DIR
]

def pack():
    print(f"🚀 Starting packaging for GitHub into: {DIST_DIR}")
    
    if os.path.exists(DIST_DIR):
        print(f"🧹 Clearing existing {DIST_DIR}...")
        shutil.rmtree(DIST_DIR)
    
    os.makedirs(DIST_DIR)

    for item in os.listdir(SOURCE_DIR):
        s = os.path.join(SOURCE_DIR, item)
        d = os.path.join(DIST_DIR, item)

        if item in IGNORE_FILES or item in IGNORE_DIRS:
            continue

        if os.path.isdir(s):
            print(f"📁 Copying directory: {item}")
            shutil.copytree(s, d, ignore=shutil.ignore_patterns(*IGNORE_FILES, *IGNORE_DIRS))
        else:
            print(f"📄 Copying file: {item}")
            shutil.copy2(s, d)

    # --- Secure Config Management ---
    config_path = os.path.join(DIST_DIR, "js", "config.js")
    if os.path.exists(config_path):
        print("🔒 Cleaning js/config.js (Removing Bridge URL)...")
        with open(config_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        with open(config_path, "w", encoding="utf-8") as f:
            for line in lines:
                if 'BRIDGE_URL:' in line:
                    f.write('    BRIDGE_URL: "https://YOUR_NEW_DEPLOYMENT_URL_HERE/exec", // ⚠️ Replace this with your actual URL\n')
                else:
                    f.write(line)

    # --- Add GitHub specialized README ---
    readme_path = os.path.join(DIST_DIR, "README_FOR_GITHUB.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("# Athar Platform - GitHub Version\n\n")
        f.write("This folder contains the public web files for the Athar platform.\n\n")
        f.write("## ⚠️ Important Security Note\n")
        f.write("- **Do NOT upload `bridge_script.js` to GitHub.** It contains your API keys.\n")
        f.write("- The file `js/config.js` in this folder has been cleaned. You must update it with your actual deployment URL after uploading.\n")
        f.write("- Make sure to use Google Apps Script as the backend to keep your API keys hidden from the public.\n")

    print(f"\n✅ Packaged successfully! You can now upload the contents of '{DIST_DIR}' to your GitHub repository.")

if __name__ == "__main__":
    pack()
