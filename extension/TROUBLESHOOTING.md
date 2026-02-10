# 🔧 Troubleshooting Guide - Button Not Responding

## Problem: Buttons (Hint, Solution, Approach, Complexity) Not Working

### Quick Fixes

#### 1. **Reload the Extension** ⚡
```
1. Go to chrome://extensions/
2. Find "DraftDeckAI Interview & DSA Prep"
3. Click the refresh icon 🔄
4. Reload the webpage
```

#### 2. **Check API Key is Configured** 🔑
```
1. Click extension icon
2. Click "⚙️ Open Full Settings"
3. Make sure API key is entered
4. Click "Test Connection"
5. Should see "✅ Connection successful!"
```

#### 3. **Check Browser Console** 🐛
```
1. Press F12 (or Ctrl+Shift+I)
2. Go to "Console" tab
3. Click one of the buttons (Hint, Solution, etc.)
4. Look for error messages
```

### Common Issues & Solutions

#### Issue 1: "No response from AI"
**Cause:** API key not configured or invalid

**Fix:**
1. Open extension settings
2. Get API key from: https://makersuite.google.com/app/apikey (Gemini - Free)
3. Paste key and save
4. Test connection

#### Issue 2: "Extension error: Could not establish connection"
**Cause:** Background script not running

**Fix:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Reload" on DraftDeckAI extension
4. Check "Service Worker" - should say "Active"
5. If it says "Inactive", click on it to wake it up

#### Issue 3: Modal appears but buttons don't respond
**Cause:** Event listeners not attached

**Fix:**
1. Check browser console for errors
2. Make sure content.js is loaded properly
3. Reload the extension and page

#### Issue 4: Nothing happens when clicking buttons
**Cause:** Content script not injected

**Fix:**
1. Make sure you're on a supported platform:
   - leetcode.com
   - hackerrank.com
   - codeforces.com
   - geeksforgeeks.org
2. Refresh the page
3. Check console for "DraftDeckAI Smart Extension activated!" message

### Testing Steps

#### Step 1: Test Extension is Loaded
1. Open `test-page.html` in your browser (included in extension folder)
2. Click "Check if Extension is Loaded"
3. Should see: "✅ Extension is loaded!"

#### Step 2: Test API Connection
1. On test page, click "Check API Key"
2. Should see: "✅ API Key is configured!"
3. Click "Send Test Message to Background"
4. Should see: "✅ Success! Response: ..."

#### Step 3: Test on Real Platform
1. Go to: https://leetcode.com/problems/two-sum/
2. Wait for page to fully load
3. Look for "📚 Get AI Help" button (bottom-right)
4. Click it
5. Click any action button

### Debug Mode

Enable detailed logging:

**In Console (F12), run:**
```javascript
// Enable debug mode
localStorage.setItem('draftdeckai_debug', 'true');

// Then refresh page
location.reload();
```

This will show detailed logs of what's happening.

### Manual Test

**Test the button handler directly in console:**
```javascript
// Open console (F12) on LeetCode/HackerRank
// Paste this code:

chrome.runtime.sendMessage(
  { 
    type: 'SOLVE_PROBLEM', 
    prompt: 'Say hello in one sentence.' 
  },
  (response) => {
    console.log('Response:', response);
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
    }
  }
);
```

Expected output: Should see response object with data.

### Check Background Script

1. Go to `chrome://extensions/`
2. Find DraftDeckAI extension
3. Click "Service worker" or "background page"
4. New DevTools window opens
5. Check Console tab for errors
6. Should see: "DraftDeckAI Smart AI Extension loaded - Ready to help! 🚀"

### Verify Files

Make sure all files are present:
```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup.js
├── settings.js
├── voice-handler.js
├── interviewer-mode.js
├── mcp-server.js
├── content.css
└── popup.html
```

### Known Issues

**Issue:** Buttons work on first click but not subsequent clicks
**Fix:** This is a modal re-initialization issue. Refresh the page.

**Issue:** Works on some sites but not others
**Fix:** Make sure site is in the supported list. Check manifest.json host_permissions.

**Issue:** "API key not configured" even after setting it
**Fix:** 
1. Clear extension storage: `chrome.storage.local.clear()`
2. Re-enter API key
3. Test again

### Still Not Working?

1. **Uninstall and Reinstall:**
   - Remove extension completely
   - Restart browser
   - Load extension again
   - Configure API key

2. **Check Permissions:**
   - Extension needs: storage, activeTab, scripting, tabs
   - Check in `chrome://extensions/` → Details → Permissions

3. **Try Different Browser:**
   - Chrome (Recommended)
   - Edge
   - Brave
   - Not Firefox (limited support)

4. **Test with Simple Prompt:**
   Open popup and try DSA problem solver with simple input:
   ```
   Given an array, find two numbers that add to a target.
   ```

### Report Issue

If none of these work, collect:
1. Browser version
2. Extension version
3. Console errors (screenshot)
4. Background script logs (screenshot)
5. API provider (Gemini/OpenAI/etc.)

Then report at: support@draftdeckai.com

---

## Quick Reference

**API Key Links:**
- Gemini (Free): https://makersuite.google.com/app/apikey
- OpenAI: https://platform.openai.com/api-keys
- Mistral: https://console.mistral.ai/
- Claude: https://console.anthropic.com/

**Test Page:** Open `test-page.html` from extension folder

**Console Shortcuts:**
- Chrome: F12 or Ctrl+Shift+I
- Mac: Cmd+Option+I

**Extension Page:** `chrome://extensions/`
