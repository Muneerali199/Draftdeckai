# Testing Settings Page

## How to Test

### Method 1: From Popup
1. Click the extension icon
2. Click "⚙️ Open Full Settings" button
3. Settings page should open in a new tab

### Method 2: Right-Click Extension Icon
1. Right-click the DraftDeckAI extension icon
2. Click "Options"
3. Settings page should open

### Method 3: From Extensions Page
1. Go to `chrome://extensions/`
2. Find DraftDeckAI extension
3. Click "Details"
4. Click "Extension options"
5. Settings page should open

### Method 4: Direct URL
1. Open a new tab
2. Type: `chrome-extension://[YOUR-EXTENSION-ID]/settings.html`
3. Replace [YOUR-EXTENSION-ID] with your actual extension ID
4. Press Enter

## What You Should See

When settings page opens, you should see:

✅ **Header:** "⚙️ DraftDeckAI Settings"

✅ **AI Provider Section:** 4 provider cards
- 🔷 Google Gemini
- 🟢 OpenAI GPT
- 🔴 Mistral AI
- 🟣 Claude (Anthropic)

✅ **API Keys Section:** 4 input fields with:
- Password input fields
- Eye icon (👁️) to toggle visibility
- "Get API Key" links
- Status badges

✅ **Preferences Section:**
- Auto-detect toggle
- Notifications toggle
- Show hints first toggle
- Default language dropdown

✅ **Action Buttons:**
- 💾 Save All Settings
- 🔌 Test Connection
- 🔄 Reset to Defaults

## Troubleshooting

### If Settings Page Doesn't Open:

1. **Check Console Errors:**
   - Right-click extension icon → "Inspect popup"
   - Look for errors in Console tab

2. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click the reload icon (🔄) on DraftDeckAI extension
   - Try again

3. **Check File Exists:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "background page" or "service worker"
   - In console, type: `chrome.runtime.getURL('settings.html')`
   - Copy the URL and paste in new tab

4. **Verify Manifest:**
   - Check that manifest.json has: `"options_page": "settings.html"`

5. **Clear Cache:**
   - Close all extension popups
   - Reload extension
   - Try opening settings again

### If Settings Page Opens But Looks Broken:

1. **Check CSS Loading:**
   - Open DevTools (F12)
   - Go to Network tab
   - Reload page
   - Check if settings.css loads successfully

2. **Check JavaScript:**
   - Open DevTools Console
   - Look for JavaScript errors
   - Check if settings.js loads

3. **Verify File Paths:**
   - All files should be in the same `extension` folder
   - settings.html, settings.css, settings.js

## Expected Behavior

✅ Clicking "Open Full Settings" should:
1. Open a new browser tab
2. Load the settings page
3. Show all AI provider options
4. Display API key input fields
5. Show preferences toggles
6. Display action buttons

✅ Settings should be:
- Fully responsive (works on mobile/tablet/desktop)
- Interactive (buttons clickable, toggles work)
- Persistent (saved settings load on next open)

## Debug Commands

Open browser console and try:

```javascript
// Check if settings page URL is correct
chrome.runtime.getURL('settings.html')

// Try opening settings directly
chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') })

// Check stored settings
chrome.storage.local.get(null, (data) => console.log(data))
```

## Still Not Working?

If settings page still doesn't open:

1. **Reinstall Extension:**
   - Remove extension
   - Reload it from folder
   - Try again

2. **Check Browser Console:**
   - Open popup
   - Right-click → Inspect
   - Check Console for errors

3. **Verify All Files Present:**
   ```
   extension/
   ├── settings.html ✓
   ├── settings.css ✓
   ├── settings.js ✓
   ├── manifest.json ✓
   └── ... other files
   ```

4. **Check Manifest Permissions:**
   - Ensure manifest.json has all required permissions
   - "storage" permission is required

## Success Indicators

✅ New tab opens with settings page
✅ All 4 AI providers visible
✅ API key inputs work
✅ Toggles are interactive
✅ Buttons are clickable
✅ Page is styled correctly
✅ No console errors

---

**If you still have issues, please share:**
1. Browser console errors
2. Network tab errors
3. Extension ID
4. Browser version
