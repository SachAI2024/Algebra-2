# Setup Guide - Algebra 2 AI Tutor

Complete setup instructions for deploying the RAG-based adaptive learning platform.

## Prerequisites

- A GitHub account (for GitHub Pages hosting)
- A HuggingFace account (free tier available)
- A Firebase account (free Spark plan works)
- Your Algebra 2 textbook PDFs

## Step 1: Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Enter project name: `algebra2-tutor` (or your choice)
   - Disable Google Analytics (optional)
   - Click "Create Project"

2. **Enable Firestore Database**
   - In Firebase Console, go to "Build" → "Firestore Database"
   - Click "Create Database"
   - Start in **Production Mode**
   - Choose a location (us-central1 recommended)
   - Click "Enable"

3. **Set Firestore Rules**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow anyone to read modules (for students)
       match /modules/{moduleId} {
         allow read: if true;
         allow write: if request.auth != null; // Only authenticated users can upload
       }

       // Allow users to write their own sessions
       match /sessions/{sessionId} {
         allow read, write: if true; // For testing, restrict in production
       }
     }
   }
   ```

4. **Enable Firebase Storage**
   - Go to "Build" → "Storage"
   - Click "Get Started"
   - Use **Production Mode**
   - Click "Done"

5. **Set Storage Rules**
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /pdfs/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null; // Only authenticated users
       }
     }
   }
   ```

6. **Get Firebase Config**
   - Go to Project Settings (gear icon) → General
   - Scroll to "Your apps" → Web apps
   - Click "Add app" (</> icon)
   - Register app with nickname
   - Copy the `firebaseConfig` object
   - Paste into `js/firebase-config.js`:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Step 2: HuggingFace API Key

1. **Create Account**
   - Go to [HuggingFace](https://huggingface.co/)
   - Sign up for free account

2. **Generate API Token**
   - Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
   - Click "New token"
   - Name: `algebra2-tutor`
   - Role: **Read** (for inference)
   - Click "Generate"
   - **Copy the token** (starts with `hf_...`)

3. **Save API Key**
   - Open your deployed app
   - Go to "Upload" page
   - Enter API key in configuration section
   - Click "Save Configuration"

## Step 3: Deploy to GitHub Pages

### Option A: Direct Upload (Simplest)

1. **Create GitHub Repository**
   ```bash
   # In your project folder
   git init
   git add .
   git commit -m "Initial commit - Algebra 2 AI Tutor"
   ```

2. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/algebra2-tutor.git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository → Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` / `root`
   - Click "Save"

4. **Access Your Site**
   - URL: `https://YOUR_USERNAME.github.io/algebra2-tutor/`
   - Wait 2-3 minutes for deployment

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI (if not installed)
# macOS: brew install gh
# Windows: choco install gh

# Login
gh auth login

# Create and push repo
gh repo create algebra2-tutor --public --source=. --remote=origin --push

# Enable Pages
gh repo edit --enable-pages --pages-branch main
```

## Step 4: Upload Content

1. **Access Upload Page**
   - Go to `https://YOUR_USERNAME.github.io/algebra2-tutor/upload.html`

2. **Configure API Key**
   - Enter your HuggingFace API key
   - Click "Save Configuration"

3. **Upload PDF**
   - Click "Drop PDF here or click to upload"
   - Select your Algebra 2 textbook chapter PDF
   - Enter a Module ID (e.g., `chapter-6-polynomials`)
   - Wait for processing (2-5 minutes)
   - Status will show progress

4. **Verify Upload**
   - Check "Uploaded Modules" section
   - Should show module with chunk count

## Step 5: Start Learning

1. **Choose Your Mode**
   - **AI Practice Sessions**: `session.html` - Adaptive, timed practice
   - **Guided Lessons**: `lessons.html` - Pre-built curriculum

2. **Start a Session**
   - Select uploaded module
   - Choose duration (10-30 minutes)
   - Set target questions (5-15)
   - Click "Start Session"

3. **Practice**
   - Answer questions within time limit
   - Get 2-3 correct → difficulty increases
   - Miss 3 attempts → see explanation + practice problems
   - View detailed report at the end

## Troubleshooting

### Firebase Not Loading
- **Symptom**: "Firebase SDK not loaded" error
- **Solution**: Clear cache, check CDN links in HTML files

### API Key Issues
- **Symptom**: "HuggingFace API key not set"
- **Solution**: Re-enter key on upload page, check browser console

### PDF Processing Fails
- **Symptom**: Upload stuck or error message
- **Solution**:
  - Ensure PDF is not encrypted
  - Try smaller PDF (under 50MB)
  - Check browser console for errors

### Questions Not Generating
- **Symptom**: "No suitable content found"
- **Solution**:
  - Upload more content (at least 5 pages)
  - Ensure PDF has text (not just images)
  - Check HuggingFace API rate limits

### Firebase Permission Denied
- **Symptom**: "Permission denied" errors
- **Solution**: Update Firestore rules (see Step 1.3)

## Local Development

To test locally:

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

Open: `http://localhost:8000`

## Production Considerations

### Security
1. **Add Authentication** (Optional but recommended)
   - Enable Firebase Authentication
   - Restrict upload.html to admin users only
   - Update Firestore rules to require auth

2. **API Key Security**
   - Consider using Firebase Functions as proxy
   - Hide API keys server-side
   - Set up rate limiting

### Performance
1. **Optimize PDFs**
   - Compress large PDFs before upload
   - Split very large books into chapters

2. **Caching**
   - Enable browser caching
   - Use CDN for static assets

### Monitoring
1. **Firebase Usage**
   - Monitor Firestore read/write quotas
   - Check Storage usage
   - Set up usage alerts

2. **API Costs**
   - HuggingFace free tier: ~30k characters/month
   - Monitor token usage in dashboard
   - Consider upgrading for heavy use

## Cost Breakdown

- **GitHub Pages**: Free
- **Firebase Spark Plan**: Free (up to 50k reads/day, 1GB storage)
- **HuggingFace Inference API**: Free tier available (or ~$0.20/1M tokens)

**Total for personal use**: $0/month 🎉

## Next Steps

1. Upload multiple chapter PDFs
2. Create student accounts (optional)
3. Track progress over time
4. Customize difficulty algorithms
5. Add more AI models for different subjects

## Support

- Check `CLAUDE.md` for development guidance
- See `README.md` for project overview
- Open issues on GitHub for bugs
