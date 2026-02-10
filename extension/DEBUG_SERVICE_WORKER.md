# 🐛 Debug Service Worker Not Starting

## Service Worker Shows "Inactive" - Let's Find Out Why

### Step 1: Click "service worker (Inactive)"

1. Go to `chrome://extensions/`
2. Find your extension
3. **Click on the blue text "service worker (Inactive)"**
4. A DevTools window will open

### Step 2: Look for Errors

In the DevTools Console tab, you'll see one of these:

#### ✅ **If you see:**
```
🚀 DraftDeckAI Smart AI Extension loaded - Ready to help!
```
**Good!** Service worker is actually working. The "Inactive" is normal when idle.

#### ❌ **If you see red errors like:**
```
Uncaught SyntaxError: ...
Uncaught ReferenceError: ...
Uncaught TypeError: ...
```
**Problem!** Tell me the exact error message.

#### ⚠️ **If you see nothing:**
The script isn't loading at all. Try next steps.

---

## Step 3: Test with Minimal Background Script

Let's test if the problem is in background.js:

### A. Backup current background.js
```powershell
Copy-Item background.js background.js.backup
```

### B. Replace with test version
```powershell
Copy-Item background-test.js background.js
```

### C. Reload extension
1. Go to chrome://extensions/
2. Click reload button
3. Click "service worker (Inactive)" again
4. Should see:
   ```
   🧪 TEST: Background script is loading...
   ✅ TEST: chrome.runtime available: true
   🎉 TEST: Background script loaded successfully!
   ```

### D. If test works:
The problem is in your main background.js file.

### E. Restore original:
```powershell
Copy-Item background.js.backup background.js
```

---

## Step 4: Common Causes

### Cause 1: File Not Found
**Check:** Does `background.js` exist in extension folder?
```powershell
Test-Path background.js
```
Should return `True`

### Cause 2: Syntax Error
**Check:** Run syntax check:
```powershell
node -c background.js
```
If error, it will show line number.

### Cause 3: Chrome Bug
Sometimes Chrome gets stuck. Try:
1. Remove extension completely
2. Restart Chrome
3. Load extension again

### Cause 4: Permissions Issue
**Check:** Can Chrome read the file?
1. Right-click background.js
2. Properties → Security
3. Make sure your user has Read permission

---

## Step 5: Force Service Worker to Start

### Method 1: Trigger via Popup
1. Click extension icon in toolbar
2. This forces service worker to wake up
3. Check chrome://extensions/ again

### Method 2: Send Message from Console
1. Open any page
2. Press F12 for console
3. Run:
```javascript
chrome.runtime.sendMessage(
  chrome.runtime.id, 
  { type: 'TEST' }, 
  (response) => console.log('Worker is active!')
);
```

### Method 3: Keep DevTools Open
1. Click "service worker (Inactive)"
2. **Keep the DevTools window open**
3. Service worker stays active while DevTools is open

---

## Step 6: Check Extension Errors

### Go to chrome://extensions/
Look for:
- "Errors" button (red)
- Yellow warning triangle
- Click them to see what's wrong

---

## Step 7: Nuclear Option - Fresh Install

If nothing works:

### A. Export your settings (if any)
```javascript
// Run in console:
chrome.storage.local.get(null, (data) => {
  console.log('Backup this:', JSON.stringify(data));
});
```

### B. Complete removal
1. Remove extension
2. Close ALL Chrome windows
3. Delete this folder (if exists):
   ```
   %LocalAppData%\Google\Chrome\User Data\Default\Extensions\[your-extension-id]
   ```
4. Restart Chrome
5. Load extension fresh

### C. Minimal test first
Before loading full extension:
1. Change manifest.json:
   ```json
   "background": {
     "service_worker": "background-test.js"
   }
   ```
2. Load extension
3. If test works, gradually add back features

---

## What to Tell Me

After trying these steps, tell me:

1. **What you see when clicking "service worker (Inactive)":**
   - Console logs?
   - Errors?
   - Nothing?

2. **Does background-test.js work?**
   - Yes = problem in main background.js
   - No = Chrome/environment issue

3. **Any yellow/red errors in chrome://extensions/?**

4. **Chrome version:**
   - Go to chrome://version/
   - Copy first line

---

## Quick Commands (Run in PowerShell)

```powershell
# Check file exists
Test-Path background.js

# Check syntax
node -c background.js

# Backup current version
Copy-Item background.js background.js.backup

# Try test version
Copy-Item background-test.js background.js
# Then reload extension in Chrome

# Restore original
Copy-Item background.js.backup background.js
```

---

## Still Stuck?

Collect this info:
1. Screenshot of chrome://extensions/ showing your extension
2. Screenshot of DevTools when clicking "service worker"
3. Chrome version (chrome://version/)
4. Windows version
5. Any error messages

Then we can troubleshoot further!
