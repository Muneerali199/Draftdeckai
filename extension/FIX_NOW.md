# 🔥 QUICK FIX - Extension Not Responding

## Your Error:
```
Error: Extension context invalidated.
```

## ⚡ INSTANT FIX (Takes 5 seconds):

### **Just Refresh the Page!**

Press one of these:
- **`F5`**
- **`Ctrl + R`**
- **Click the refresh button** in your browser

That's it! ✅

---

## Why This Happens

When you:
1. Reload the extension in `chrome://extensions/`
2. Update extension files
3. Chrome restarts the background script

The connection breaks between the page and the extension.

**Solution:** Refresh the page to reconnect.

---

## ✅ After Refreshing:

1. You should see in console: `🚀 DraftDeckAI Smart Extension activated!`
2. Click "📚 Get AI Help" button again
3. Click "💡 Get Hint" or any button
4. It should work now!

---

## Still Not Working After Refresh?

### Check These:

**1. Is Extension Active?**
```
chrome://extensions/ → Find DraftDeckAI → Should be enabled ✅
```

**2. Is Service Worker Active?**
```
chrome://extensions/ → DraftDeckAI → Click "service worker" 
Should show "Active" (not "Inactive")
```

**3. Is API Key Configured?**
```
Click extension icon → Settings → Check API key is entered
```

---

## Test Now:

1. **Refresh the LeetCode page** (F5)
2. **Open console** (F12)
3. **Click "Get AI Help" button**
4. **Click "Get Hint"**
5. **Watch console** - should show:
   - `📤 Sending message to background: hint`
   - `📥 Received response: ...`

If you see those messages = **IT'S WORKING!** 🎉

---

## Pro Tip 💡

**Every time you reload the extension**, refresh all open LeetCode/HackerRank tabs.

Or use the test page:
1. Open `test-page.html` 
2. Click "Send Test Message to Background"
3. Should see success message

---

## Emergency Reset:

If nothing works:
1. **Remove extension** completely
2. **Restart browser**
3. **Load extension** again
4. **Add API key**
5. **Open LeetCode**
6. **Try again**

---

**Questions?** Check `TROUBLESHOOTING.md` for detailed help.
