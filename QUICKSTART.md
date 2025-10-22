# Quick Start Guide

Get your AI-powered Algebra 2 tutor running in under 10 minutes!

## For Students (No Setup Required)

If your teacher already set up the platform:

1. **Visit the website** your teacher provided
2. Click **"Start AI Session"**
3. Select a module
4. Start practicing!

That's it! No account needed, no installation.

---

## For Teachers/Admins (First-Time Setup)

### Step 1: Get Free API Key (2 minutes)

1. Go to [HuggingFace](https://huggingface.co/join)
2. Create free account
3. Visit [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token" → Name: `algebra2-tutor` → Role: **Read**
5. Copy the token (starts with `hf_...`)

### Step 2: Deploy to GitHub Pages (3 minutes)

```bash
# Clone or download this repo
git clone https://github.com/your-username/algebra2-tutor.git
cd algebra2-tutor

# Create your own repo
git remote set-url origin https://github.com/YOUR_USERNAME/algebra2-tutor.git
git push -u origin main

# Enable GitHub Pages
# Go to: Settings → Pages → Source: main branch → Save
```

Your site will be live at: `https://YOUR_USERNAME.github.io/algebra2-tutor/`

**OR use GitHub CLI:**
```bash
gh repo create algebra2-tutor --public --source=. --push
gh repo edit --enable-pages --pages-branch main
```

### Step 3: Configure API Key (1 minute)

1. Visit `https://YOUR_USERNAME.github.io/algebra2-tutor/upload.html`
2. Paste your HuggingFace API key
3. Click "Save Configuration"

### Step 4: Upload Content (5 minutes)

1. On the upload page, click "Drop PDF here"
2. Select your Algebra 2 textbook chapter (PDF)
3. Enter Module ID (e.g., `chapter-6-polynomials`)
4. Wait 2-5 minutes for processing
5. See "Ready" status when done

### Step 5: Share with Students

Share this link with your students:
```
https://YOUR_USERNAME.github.io/algebra2-tutor/
```

They can immediately:
- Use guided lessons (no setup)
- Practice with AI-generated questions
- Track their progress

---

## Optional: Firebase Setup (For Cloud Storage)

If you want cloud storage instead of localStorage:

1. **Create Firebase Project** (free)
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Firestore + Storage

2. **Get Config**
   - Project Settings → Add Web App
   - Copy `firebaseConfig` object

3. **Update Code**
   - Edit `js/firebase-config.js`
   - Paste your config

See [SETUP.md](SETUP.md) for detailed Firebase instructions.

---

## Testing Your Setup

### Test Classic Mode
1. Visit `https://YOUR_USERNAME.github.io/algebra2-tutor/lessons.html`
2. Should see 4 modules
3. Click through a few steps
4. Verify progress saves

### Test AI Mode
1. Visit `https://YOUR_USERNAME.github.io/algebra2-tutor/session.html`
2. Select your uploaded module
3. Click "Start Session"
4. Answer a few questions
5. Check if difficulty adapts

### Test Upload
1. Visit upload page
2. Upload a small PDF (3-5 pages)
3. Check processing completes
4. Verify in "Uploaded Modules" list

---

## Troubleshooting

### "No modules available"
**Problem**: No PDFs uploaded yet
**Solution**: Go to upload page and upload a PDF chapter

### "API key not set"
**Problem**: HuggingFace key not configured
**Solution**: Visit upload page, enter key, click save

### "Model is loading"
**Problem**: Cold start on HuggingFace (normal)
**Solution**: Wait 20-30 seconds, it will auto-retry

### Upload stuck
**Problem**: PDF too large or encrypted
**Solution**: Try smaller PDF (under 50MB), ensure not password-protected

### Questions not generating
**Problem**: PDF has no text (scanned images only)
**Solution**: Use OCR on PDF first, or upload text-based PDF

---

## What Students Will See

### Landing Page (index.html)
- Choose between guided lessons or AI practice
- Clear feature descriptions
- One-click start

### Guided Lessons (lessons.html)
- 4 pre-built modules (Polynomials, Multiply, Binomial, Factoring)
- Step-by-step problems with hints
- Instant validation
- Progress tracking

### AI Practice (session.html)
- 20-minute timed sessions
- Questions from uploaded PDFs
- Adaptive difficulty (gets harder as you improve)
- 3 attempts per question
- Detailed explanations when wrong
- Practice problems for struggling concepts
- Performance report at end

---

## Cost Breakdown

✅ **GitHub Pages**: FREE
✅ **HuggingFace (free tier)**: FREE (~30k chars/month)
✅ **Firebase (optional)**: FREE (Spark plan)

**Total: $0/month for personal/classroom use**

For heavy usage (100+ students):
- HuggingFace Pro: ~$9/month
- Firebase Blaze: Pay-as-you-go (usually <$5/month)

---

## Next Steps

Once setup is complete:

1. **Upload More Content**
   - Upload all relevant chapters
   - Organize by module ID
   - Students can practice from any module

2. **Customize Difficulty**
   - Edit `js/session-manager.js`
   - Adjust `streakToLevelUp` (default: 2)
   - Adjust `fastThresholdMs` (default: 45000ms)

3. **Monitor Usage**
   - Check HuggingFace dashboard for API usage
   - Check Firebase console for storage usage
   - Review student session data in Firestore

4. **Add Features**
   - See [CLAUDE.md](CLAUDE.md) for development guide
   - Common additions: auth, dashboards, more subjects

---

## Getting Help

1. **Check Documentation**
   - [README.md](README.md) - Overview & features
   - [SETUP.md](SETUP.md) - Detailed setup
   - [CLAUDE.md](CLAUDE.md) - Developer guide

2. **Test Locally**
   ```bash
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

3. **Check Browser Console**
   - Press F12 → Console tab
   - Look for error messages
   - Common issues show helpful logs

4. **Common Fixes**
   - Clear browser cache
   - Verify API key is correct
   - Check Firebase rules (if using)
   - Try in incognito mode

---

## Success Checklist

- [ ] GitHub Pages site is live
- [ ] HuggingFace API key configured
- [ ] At least one PDF uploaded and processed
- [ ] Test session completes successfully
- [ ] Classic lessons mode works
- [ ] Students can access site
- [ ] Progress saves correctly

**All checked? You're ready to teach! 🎉**

---

## Tips for Best Results

### For Teachers
- Upload PDFs chapter-by-chapter (easier to process)
- Use descriptive module IDs (`chapter-6-section-1`)
- Test upload with small PDF first
- Give students demo before assigning

### For Students
- Do guided lessons first to learn concepts
- Use AI practice for timed challenges
- Review explanations when you get 3 wrong
- Track your timing improvements
- Practice regularly (10-20 min/day)

### For Content
- Use text-based PDFs (not scanned images)
- Ensure good quality math notation
- Include worked examples in PDFs
- 3-10 pages per module is ideal

---

**Ready to transform Algebra 2 learning with AI? Let's go! 🚀**
