# 🔐 Secure API Key Setup Guide

## ⚠️ IMPORTANT: Never Commit Your API Keys to GitHub!

Your HuggingFace API key is **sensitive** and should **NEVER** be committed to your repository. Here's how to configure it securely.

---

## ✅ Secure Method: Configure API Key in the Browser (Recommended)

Your API key is stored **only in your browser's localStorage** and is **never** sent to GitHub.

### Step-by-Step Instructions:

1. **Get Your HuggingFace API Key**
   - Go to https://huggingface.co/settings/tokens
   - Click "New token"
   - Give it a name (e.g., "Algebra 2 Tutor")
   - Select "Read" permissions
   - Click "Generate"
   - **Copy the token** (it looks like: `hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ...`)

2. **Configure in Your Application**

   Visit your GitHub Pages site at:
   ```
   https://sachai2024.github.io/Algebra-2/upload.html
   ```

3. **Enter Your API Key**
   - On the upload page, you'll see an **"API Key Settings"** section
   - Paste your HuggingFace API key in the input field
   - Click **"Save API Key"**
   - You should see a green success message: ✅ "API key saved successfully!"

4. **Verify It Works**
   - The key is now stored in your browser's localStorage
   - It will persist across page refreshes
   - It's **only on your local machine** - not on GitHub

---

## 🔍 Where the API Key is Used

Your API key is used in these modules:
- `js/ai-service.js` - For HuggingFace Inference API calls
  - Question generation
  - Embedding generation
  - Answer explanations
  - Practice problem generation

The code **retrieves** the key from localStorage:
```javascript
// From ai-service.js
getAPIKey() {
  if (!this.apiKey) {
    this.apiKey = localStorage.getItem('hf_api_key') || '';
  }
  return this.apiKey;
}
```

---

## ✅ Security Best Practices (Already Implemented)

### 1. **No API Keys in Code**
✅ The codebase does **NOT** contain any hardcoded API keys
✅ Placeholder values only: `YOUR_API_KEY`, `YOUR_PROJECT.firebaseapp.com`

### 2. **localStorage-Only Storage**
✅ API key is stored **only** in the browser's localStorage
✅ Each user configures their **own** API key on their machine
✅ Keys are **never** committed to Git or sent to GitHub

### 3. **Secure Logging**
✅ The logging system **masks** API keys in logs:
```javascript
// Only logs masked version
logger.info('AIService', 'API key configured', {
  keyLength: key.length,
  masked: key.substring(0, 8) + '...'  // Only shows first 8 chars
});
```

### 4. **No Sensitive Data in Logs**
✅ Passwords are **never** logged
✅ API keys are **never** logged in full
✅ Only metadata is logged (length, presence, masked prefix)

---

## 📍 Where to Configure Your API Key

### For GitHub Pages Deployment:

**URL:** `https://sachai2024.github.io/Algebra-2/upload.html`

1. Open the upload page
2. Look for the **"Settings"** or **"API Key Configuration"** section at the top
3. Enter your HuggingFace API key
4. Click "Save API Key"
5. The key is now stored in **your browser only**

### For Local Development:

**URL:** Open `upload.html` in your browser locally

1. Open `file:///path/to/Algebra-2/upload.html`
2. Same process as above - enter your key and save
3. The key is stored in localStorage for that browser/origin

---

## 🔄 How It Works

```
User's Browser (Your Computer)
    ↓
[Enter API Key on upload.html]
    ↓
[Saved to localStorage: "hf_api_key"]
    ↓
[AIService retrieves from localStorage when needed]
    ↓
[API calls made directly from browser to HuggingFace]
    ↓
[Key never touches GitHub or any server]
```

**Important:** The API key is sent **directly** from your browser to HuggingFace's servers. It **never** goes through GitHub Pages or any intermediate server.

---

## ❌ What NOT to Do

### ❌ Don't Hardcode API Keys
```javascript
// ❌ NEVER DO THIS
const apiKey = 'hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ...';
```

### ❌ Don't Commit .env Files with Keys
```bash
# ❌ Don't add these to Git
.env
config.json
secrets.js
```

### ❌ Don't Share Your API Key
- Don't post it in issues
- Don't share in pull requests
- Don't include in screenshots
- Don't send in emails unless encrypted

---

## 🔧 If You Accidentally Committed an API Key

If you accidentally committed your API key to GitHub:

1. **Immediately Revoke the Key**
   - Go to https://huggingface.co/settings/tokens
   - Find the compromised token
   - Click "Revoke" or delete it

2. **Generate a New Key**
   - Create a new token with the same permissions
   - Configure it in your browser (as described above)

3. **Clean Git History (Optional)**
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # This is advanced - only if needed
   ```

4. **Never reuse the old key** - assume it's compromised

---

## 📱 Multi-Device Usage

If you want to use the app on multiple devices:

1. Each device needs its **own browser configuration**
2. Get your API key from HuggingFace (same key can be reused)
3. Configure it on each device's browser separately:
   - Desktop: Configure in desktop browser
   - Laptop: Configure in laptop browser
   - Tablet: Configure in tablet browser
   - Phone: Configure in mobile browser

The key is stored per-browser, so you'll need to configure it once per device/browser.

---

## 🔐 Additional Security Options (Optional)

### Option 1: Firebase Environment Config (Advanced)

If you're using Firebase, you can use Firebase Remote Config:

1. Store API keys in Firebase Remote Config
2. Fetch them at runtime (requires Firebase authentication)
3. More complex but more centralized

### Option 2: Backend Proxy (Most Secure)

For maximum security, use a backend proxy:

1. Create a backend server (Node.js, Python, etc.)
2. Store API key on the server (use environment variables)
3. Frontend calls your backend
4. Backend calls HuggingFace with the key
5. Backend returns results to frontend

**Note:** This requires a server, which goes beyond the static GitHub Pages deployment.

---

## ✅ Current Configuration Check

To verify your setup is secure:

### 1. Check Your Repository
```bash
# Run in your repo directory
git log --all --full-history --source -- '*api*' '*key*' '*secret*'
```

If this shows any commits with API keys, they need to be removed.

### 2. Check Your Code Files
```bash
# Search for potential API keys
grep -r "hf_" . --exclude-dir=node_modules --exclude-dir=.git
```

Should return nothing or only references in documentation.

### 3. Verify localStorage Storage
Open browser console on your site:
```javascript
// Check if key exists (without revealing it)
console.log('API key configured:', !!localStorage.getItem('hf_api_key'));
console.log('Key length:', localStorage.getItem('hf_api_key')?.length);
```

---

## 📊 Testing Your Configuration

1. **Test API Key Entry**
   ```
   1. Go to upload.html
   2. Enter a test key
   3. Check browser console for: ✅ "API key saved successfully"
   ```

2. **Test API Key Retrieval**
   ```javascript
   // In browser console
   console.log('Has API key:', aiService.getAPIKey() ? 'Yes' : 'No');
   ```

3. **Test API Call**
   ```
   1. Try uploading a PDF
   2. Check console for API call logs
   3. Should show: "API Call: POST https://api-inference.huggingface.co/..."
   ```

---

## 📞 Support

If you have issues with API key configuration:

1. **Check browser console** for errors
2. **Enable DEBUG logging**: `LogConfig.level = 'DEBUG'`
3. **Check the logs**: `logger.getLogsByModule('AIService')`
4. **Verify localStorage**: Open DevTools → Application → Local Storage

---

## Summary: The Safe Way ✅

✅ **DO:** Configure API key in the browser's upload page
✅ **DO:** Store in localStorage only
✅ **DO:** Each user configures their own key
✅ **DO:** Keep keys out of Git history
✅ **DO:** Revoke compromised keys immediately

❌ **DON'T:** Hardcode API keys in code
❌ **DON'T:** Commit keys to GitHub
❌ **DON'T:** Share keys publicly
❌ **DON'T:** Include keys in screenshots

---

**Your application is already configured securely!** Just visit the upload page and enter your HuggingFace API key.
