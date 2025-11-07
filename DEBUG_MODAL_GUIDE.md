# Debug Modal Guide

## 🔬 Real-Time Processing Visualization

When you upload a PDF, a **debug modal** automatically opens showing real-time progress through all processing stages.

---

## What You'll See

### 5 Processing Stages (with live timers)

1. **📤 Firebase Upload** - Uploading PDF to cloud storage
2. **📄 PDF Extraction** - Extracting text from PDF pages
3. **✂️ Text Chunking** - Splitting text into manageable chunks
4. **🧠 Embedding Generation** - Creating vector embeddings (SLOWEST)
5. **💾 Data Storage** - Saving processed data

Each stage shows:
- ⏱️ **Live Timer** - How long the stage has been running
- 📊 **Metrics** - Key statistics (pages, chunks, batch numbers, etc.)
- 📝 **Live Logs** - Real-time activity log with color coding
- 📈 **Progress Bar** - Visual progress indicator
- ✅ **Status Indicator** - Spinner (active) → Checkmark (complete) → X (error)

---

## Where to Find Logs

### 1. **Debug Modal (Primary)** ✨

**When:** Automatically opens during PDF upload
**Location:** Full-screen overlay modal
**What you see:**

```
🔬 Processing Debug View

📤 Firebase Upload                    [✓] 2.3s
├─ File Name: algebra-chapter-6.pdf
├─ File Size: 1.25 MB
├─ Module ID: chapter-6
└─ Logs:
   [10:30:15] Starting Firebase upload
   [10:30:17] Firebase upload completed successfully

📄 PDF Extraction                     [✓] 3.1s
├─ Pages Extracted: 15
├─ Text Length: 45,823 chars
├─ Extraction Time: 3.1s
└─ Logs:
   [10:30:18] Initializing PDF.js parser
   [10:30:21] Extracted 15 pages successfully

✂️ Text Chunking                      [✓] 0.2s
├─ Total Chunks: 95
├─ Avg Chunk Size: 782 chars
├─ Config: maxSize:800, overlap:100
└─ Logs:
   [10:30:21] Combining text from all pages
   [10:30:21] Total text length: 45,823 characters
   [10:30:21] Splitting into 800-char chunks...
   [10:30:21] Created 95 text chunks

🧠 Embedding Generation               [●] 48.2s
├─ Model: sentence-transformers/all-MiniLM-L6-v2
├─ Batch Size: 5 chunks/batch
├─ Total Batches: 19
├─ Embeddings Generated: 95
├─ Dimensions: 384
├─ Total Time: 48.2s
├─ Avg Time/Batch: 2.54s
└─ Logs:
   [10:30:21] Starting batch embedding generation
   [10:30:21] Processing 95 chunks in batches of 5
   [10:30:23] Processing batch 1/19 (chunks 1-5)
   [10:30:25] Waiting 1s (rate limit)...
   [10:30:28] Processing batch 2/19 (chunks 6-10)
   ...
   [10:31:09] All embeddings generated successfully

💾 Data Storage                       [✓] 1.8s
├─ Data Size: 1,245,678 bytes
├─ Storage Location: Firebase + localStorage
└─ Logs:
   [10:31:09] Preparing module content for storage
   [10:31:09] Saving 95 chunks to storage
   [10:31:11] Module content saved successfully

✓ Processing Complete! Total time: 55.6s
```

### 2. **Browser Console** (Backup/Technical)

**How to open:**
- Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- Firefox: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- Safari: `Cmd+Option+C` (Mac)

**What you see:**
- Standard console.log/error messages
- Detailed error stack traces
- Network request information
- Performance timing data

**Example logs:**
```javascript
[INFO] [AIService] Batch embedding generation started
[INFO] [AIService] Processing batch 1/19
[INFO] [AIService] Processing batch 2/19
[NOTICE] [RAGEngine] PDF processing completed successfully
```

### 3. **Logging System** (Advanced)

**Enable detailed logging:**
```javascript
// Open browser console (F12) and run:
LogConfig.level = 'DEBUG';
```

**View logs programmatically:**
```javascript
// Get recent logs
logger.getRecentLogs(50);

// Get logs by module
logger.getLogsByModule('AIService', 100);
logger.getLogsByModule('RAGEngine', 100);

// Get only errors
logger.getLogsByLevel(logger.levels.ERROR);

// Export all logs
logger.exportLogs();  // Downloads JSON file
```

**Example output:**
```javascript
[
  {
    timestamp: "2025-01-15T10:30:21.123Z",
    level: 6,
    levelName: "INFO",
    module: "AIService",
    message: "Batch embedding generation started",
    context: { totalTexts: 95, batchSize: 5 }
  },
  // ... more logs
]
```

---

## Understanding the Stages

### Stage 1: Firebase Upload (2-10 seconds)
**What's happening:** PDF file is being uploaded to cloud storage

**Metrics shown:**
- File name
- File size
- Module ID

**Possible issues:**
- ❌ "Firebase upload failed" → Falls back to localStorage (non-critical)
- Check Firebase configuration if cloud storage is needed

---

### Stage 2: PDF Extraction (1-10 seconds)
**What's happening:** PDF.js is parsing the PDF and extracting text from each page

**Metrics shown:**
- Pages extracted
- Total text length
- Extraction time

**Possible issues:**
- ❌ "Failed to extract PDF" → PDF may be corrupted or password-protected
- ❌ "PDF.js not loaded" → Check internet connection, PDF.js library failed to load

---

### Stage 3: Text Chunking (<1 second)
**What's happening:** Extracted text is being split into ~800 character chunks with overlap

**Metrics shown:**
- Total chunks created
- Average chunk size
- Chunking configuration

**Possible issues:**
- Usually very fast, rarely fails
- If it fails, text extraction likely had issues

---

### Stage 4: Embedding Generation ⏰ (30 seconds - 10+ minutes)
**What's happening:** Each text chunk is being converted into a vector embedding via HuggingFace API

**This is the SLOWEST stage** because:
- Each batch of 5 chunks takes ~2-3 seconds
- 1 second delay between batches (rate limiting)
- Network latency for API calls

**Metrics shown:**
- Model name (sentence-transformers/all-MiniLM-L6-v2)
- Batch size (5 chunks per batch)
- Total batches
- Current batch number (updates live!)
- Embeddings generated
- Dimensions (384)
- Total time, average time per batch

**Live logs show:**
```
Processing batch 1/19 (chunks 1-5)
Waiting 1s (rate limit)...
Processing batch 2/19 (chunks 6-10)
Waiting 1s (rate limit)...
...
```

**Progress bar:** Shows batch completion percentage

**Possible issues:**
- ❌ "API key not configured" → Configure HuggingFace API key first
- ❌ "API Error: 401" → Invalid API key
- ❌ "API Error: 503" → Model is loading (wait 20s, automatic retry)
- ❌ "API Error: 429" → Rate limit exceeded (reduce upload frequency)
- ❌ "Network error" → Check internet connection

---

### Stage 5: Data Storage (1-5 seconds)
**What's happening:** Processed chunks and embeddings are being saved to Firebase and localStorage

**Metrics shown:**
- Data size (in bytes)
- Storage location

**Possible issues:**
- ❌ "Failed to save content" → Check Firebase configuration or localStorage quota
- Usually works with localStorage even if Firebase fails

---

## Error Handling

### When Errors Occur

The debug modal will:
1. **Stop on the failing stage** - Shows red border and X icon
2. **Display error message** - In red in the logs
3. **Show stack trace** - Technical details for debugging
4. **Provide troubleshooting tips** - Specific to the error type

**Example error display:**
```
🧠 Embedding Generation               [✗] 15.2s
├─ Logs:
   [10:30:21] Starting batch embedding generation
   [10:30:23] Processing batch 1/19
   [10:30:38] ERROR: API Error: 401 - Unauthorized
   [10:30:38] Stack trace: Error: API Error: 401...

✗ Processing Failed
API Error: 401 - Unauthorized

Troubleshooting:
• Check your API key configuration
• Verify internet connection
• Check HuggingFace API status
```

### Error Types & Solutions

| Error | Location | Solution |
|-------|----------|----------|
| **API key not configured** | Embeddings | Enter API key in settings |
| **API Error: 401** | Embeddings | Check API key is valid |
| **API Error: 503** | Embeddings | Wait 20s, model is loading |
| **API Error: 429** | Embeddings | Rate limit - wait a few minutes |
| **Network error** | Multiple | Check internet connection |
| **PDF.js not loaded** | Extraction | Reload page, check internet |
| **Failed to extract PDF** | Extraction | Try different PDF, check if corrupted |
| **Firebase init failed** | Upload | Non-critical, uses localStorage |
| **LocalStorage quota exceeded** | Storage | Clear old modules |

---

## Tips for Using the Debug Modal

### 1. **Keep It Open**
- Don't close the modal during processing
- It automatically closes after completion
- Can manually close with X button (processing continues)

### 2. **Watch the Embedding Stage**
- This is the slowest part (80-90% of total time)
- Each batch takes ~2-3 seconds
- Live progress shows exactly which batch is processing
- Be patient - this is normal!

### 3. **Check Timers**
- Each stage has a live timer
- Compare actual times to expected times
- If a stage takes much longer, may indicate an issue

### 4. **Read the Logs**
- Color coded for easy reading:
  - 🔵 Blue = Info
  - 🟢 Green = Success
  - 🟡 Yellow = Warning
  - 🔴 Red = Error
- Scroll through logs to see detailed activity
- Logs auto-scroll to show latest entries

### 5. **Save Logs for Debugging**
If you encounter issues:
```javascript
// In browser console
logger.exportLogs();  // Downloads all logs as JSON
```

Then share the JSON file for troubleshooting.

---

## Expected Timings

| Stage | Small PDF (5 pages) | Medium PDF (20 pages) | Large PDF (50 pages) |
|-------|---------------------|----------------------|---------------------|
| **Upload** | 2s | 5s | 10s |
| **Extraction** | 1s | 3s | 8s |
| **Chunking** | <1s | <1s | <1s |
| **Embeddings** | 15-20s | 50-60s | 120-180s |
| **Storage** | 1s | 2s | 5s |
| **TOTAL** | **~20-25s** | **~60-70s** | **~140-200s** |

**Key takeaway:** Embedding generation is 80-90% of total time.

---

## Troubleshooting Checklist

If processing seems stuck:

1. ✅ **Check the debug modal** - See which stage is active
2. ✅ **Look at the timer** - Is it increasing? (Processing is working)
3. ✅ **Check the logs** - Any error messages?
4. ✅ **Browser console** - Press F12, check for JavaScript errors
5. ✅ **Network tab** - Check for failed API requests
6. ✅ **API key** - Verify it's configured and valid
7. ✅ **Internet** - Check your connection is stable
8. ✅ **Wait longer** - Large PDFs can take 5-10+ minutes

---

## Advanced: Logging System Integration

The debug modal works alongside the main logging system.

### Enable Verbose Logging

```javascript
// Before uploading, run in console:
LogConfig.applyProfile('development');  // Maximum verbosity
```

### Monitor Specific Modules

```javascript
// Watch AI service logs
logger.setModuleLevel('AIService', 'DEBUG');

// Watch RAG engine logs
logger.setModuleLevel('RAGEngine', 'DEBUG');

// View logs
console.table(logger.getLogsByModule('AIService'));
```

### Export Logs for Analysis

```javascript
// Export all logs
logger.exportLogs();

// Or get as JSON
const logs = logger.getRecentLogs(1000);
console.log(JSON.stringify(logs, null, 2));
```

---

## Summary

**Primary Tool:** Debug Modal (automatic, visual, user-friendly)
**Backup:** Browser Console (technical, for developers)
**Advanced:** Logging System (programmatic access, export)

**When uploading:**
1. Debug modal opens automatically ✅
2. Watch live progress through 5 stages ✅
3. See exactly what's happening in real-time ✅
4. If errors occur, see detailed troubleshooting tips ✅
5. Keep modal open to monitor progress ✅

**The embedding stage will take the longest - this is normal!**

---

## Quick Reference

```javascript
// View debug modal (if closed)
document.getElementById('debugModal').classList.add('active');

// Close debug modal
document.getElementById('debugModal').classList.remove('active');

// Enable DEBUG logging
LogConfig.level = 'DEBUG';

// View recent logs
logger.getRecentLogs(50);

// Export logs
logger.exportLogs();

// Check if processing is working
// → Look at debug modal timers (should be increasing)
// → Check browser console for errors (F12)
// → Check network tab for API calls
```

---

**The debug modal gives you complete visibility into the PDF processing pipeline!** 🎉
