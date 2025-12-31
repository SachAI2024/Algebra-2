# Algebra 2 Tutor — AI-Powered Adaptive Learning

A modern, AI-powered tutoring platform for Algebra 2 students featuring RAG-based question generation, adaptive difficulty, and personalized learning paths.

## 🌟 Features

### 🤖 RAG-Powered Practice Sessions (NEW!)
- **Upload Your Own Textbooks**: Upload PDF chapters and get custom questions from your actual curriculum
- **AI Question Generation**: Using HuggingFace Qwen-Math to generate contextual math problems
- **Adaptive Difficulty**: 2-3 correct answers in a row → increase difficulty automatically
- **Timed Sessions**: 20-minute sessions with 7-10 questions
- **Smart Retry System**: 3 attempts per question with AI-generated explanations
- **Practice Problems**: Get 3-4 practice problems after failing to reinforce concepts
- **Performance Analytics**: Track timing, identify slow questions, get personalized recommendations

### 📚 Guided Lessons (Classic Mode)
- **4 Comprehensive Modules**: Covering sections 6.1-6.4
  - Add & Subtract Polynomials
  - Multiply Polynomials
  - Binomial Theorem
  - Factoring
- **Interactive Steps**: Step-by-step problems with validation
- **Built-in Hints**: Contextual help when stuck
- **Progress Tracking**: Save progress locally
- **Learn/Practice Modes**: Toggle between guided and self-paced

## 🚀 Quick Start

### For Students

1. **Visit the Website**: `https://YOUR_USERNAME.github.io/algebra2-tutor/`
2. **Choose Your Mode**:
   - **AI Practice** → Upload content, start adaptive sessions
   - **Guided Lessons** → Pre-built curriculum, start immediately
3. **Start Learning!**

### For Admins/Teachers

1. **Setup** (5 minutes):
   - Get free HuggingFace API key
   - Configure Firebase (optional, for cloud storage)
   - See [SETUP.md](SETUP.md) for detailed instructions

2. **Upload Content**:
   - Go to `upload.html`
   - Enter API key
   - Upload PDF textbook chapters
   - Wait for processing (2-5 min per chapter)

3. **Share with Students**:
   - Students access via GitHub Pages URL
   - No login required (optional Firebase auth)

## 📁 Project Structure

```
algebra2_tutor_clean/
├── index.html              # Landing page
├── lessons.html            # Guided lessons (classic mode)
├── session.html            # AI practice sessions
├── upload.html             # PDF upload & management
├── test.html               # Unit tests
├── css/
│   └── style.css           # All styles
├── js/
│   ├── core.js             # Math utilities & test harness
│   ├── lessons.js          # Pre-built lesson content
│   ├── quiz.js             # Quiz question generators
│   ├── app.js              # Classic mode navigation
│   ├── firebase-config.js  # Firebase initialization
│   ├── pdf-processor.js    # PDF text/image extraction
│   ├── ai-service.js       # HuggingFace API integration
│   ├── rag-engine.js       # RAG system & embeddings
│   └── session-manager.js  # Adaptive sessions & analytics
└── SETUP.md                # Detailed setup instructions
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI/ML**:
  - HuggingFace Inference API (Qwen-Math for questions)
  - Sentence Transformers (embeddings)
- **PDF Processing**: PDF.js
- **Backend**: Firebase (Firestore + Storage)
- **Hosting**: GitHub Pages (100% static, no build tools!)

## 🎯 How It Works

### RAG System Architecture

1. **PDF Upload** → Extract text + images using PDF.js
2. **Chunking** → Split content into ~800 character chunks with overlap
3. **Embeddings** → Generate vector embeddings via HuggingFace
4. **Storage** → Save chunks + embeddings to Firebase/localStorage
5. **Retrieval** → Find relevant chunks using cosine similarity
6. **Generation** → Use Qwen-Math to generate questions from context
7. **Adaptation** → Adjust difficulty based on student performance

### Adaptive Algorithm

```
If student gets 2-3 correct in a row (and fast):
  → Increase difficulty level

If student fails 3 attempts:
  → Show detailed explanation (AI-generated)
  → Provide 3-4 practice problems
  → Decrease difficulty level
  → Reset streak
```

## 🧪 Development

### Run Locally

```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js
npx http-server -p 8000

# Option 3: VS Code Live Server
# Install "Live Server" extension
# Right-click index.html → "Open with Live Server"
```

Open `http://localhost:8000`

### Avoid CORS issues with Hugging Face

Hugging Face's Inference API does not send CORS headers, so direct browser calls from GitHub Pages will fail with `Failed to fetch`. Run the included proxy locally and point the Upload page at it:

```bash
HF_API_KEY=your_hf_key node proxy-server.js
# Proxy listens on http://localhost:8787/api/inference by default
```

Then in `upload.html`:
1. Open the **Embedding Proxy URL** field.
2. Enter `http://localhost:8787/api/inference`.
3. Save configuration (API key optional when proxy has HF_API_KEY set).

### Run Tests

Open `test.html` in browser to see unit test results.

### Add New Lessons

Edit `js/lessons.js` to add modules:

```javascript
{
  id: "new-topic",
  tag: "6.5",
  title: "New Topic",
  sub: "Description",
  steps: [
    () => stepInfo(`<div>Content...</div>`),
    () => stepInput("Question", "placeholder", validatorFn, "hint")
  ]
}
```

## 📊 Features Breakdown

| Feature | Classic Mode | AI Mode |
|---------|-------------|---------|
| Content Source | Pre-built | Upload PDFs |
| Question Generation | Static | AI-powered |
| Difficulty Adaptation | Manual quiz | Automatic |
| Timed Sessions | No | Yes (20 min) |
| Attempt Limits | Unlimited | 3 attempts |
| Explanations | Pre-written | AI-generated |
| Practice Problems | No | Auto-generated |
| Analytics | Basic | Advanced |
| Offline Support | Yes | Partial |
| Setup Required | None | API key + Firebase |

## 🎓 Educational Philosophy

1. **Adaptive Learning**: Students work at their own pace and level
2. **Immediate Feedback**: Know if you're right or wrong instantly
3. **Conceptual Understanding**: Explanations focus on "why", not just "what"
4. **Practice Makes Perfect**: Automatic generation of similar problems
5. **Time Management**: Learn to solve problems efficiently
6. **Self-Paced**: No pressure, learn when you're ready

## 🔒 Privacy & Security

- **Local-First**: Progress stored in browser localStorage
- **Optional Cloud**: Firebase for multi-device sync
- **API Keys**: Stored locally, never transmitted except to HuggingFace
- **No Tracking**: No analytics, no cookies, no data collection
- **Open Source**: Fully auditable code

## 📈 Roadmap

- [ ] Multi-subject support (Algebra 1, Geometry, Pre-Calc)
- [ ] Teacher dashboard with student analytics
- [ ] Collaborative learning (share questions)
- [ ] Voice input for math problems
- [ ] Mobile app (PWA)
- [ ] More AI models (GPT-4, Claude, Gemini)
- [ ] Spaced repetition system
- [ ] Achievement system & badges

## 🤝 Contributing

Contributions welcome! This is an educational project aimed at helping students.

## 📄 License

MIT License - free to use, modify, and distribute.

## 🙏 Acknowledgments

- HuggingFace for free inference API
- Firebase for free hosting & database
- PDF.js for PDF processing
- Qwen team for excellent math models
- All the students who will benefit from this!

## 📚 Documentation

- [SETUP.md](SETUP.md) - Complete setup instructions
- [LOGGING_GUIDE.md](LOGGING_GUIDE.md) - Logging system documentation
- [API_KEY_SETUP.md](API_KEY_SETUP.md) - Secure API key configuration
- Open `test.html` for code examples

---

**Built with ❤️ for students learning Algebra 2**
