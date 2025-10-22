// PDF Processing using PDF.js
// Extracts text and images from uploaded PDFs

class PDFProcessor {
  constructor() {
    this.pdfjsLib = null;
  }

  async init() {
    // PDF.js should be loaded via CDN in HTML
    if (typeof pdfjsLib !== 'undefined') {
      this.pdfjsLib = pdfjsLib;
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('PDF.js initialized');
    } else {
      console.error('PDF.js not loaded');
    }
  }

  async processPDF(file, options = {}) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const extractText = options.extractText !== false;
    const extractImages = options.extractImages !== false;

    const pages = [];
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const pageData = {
        pageNumber: pageNum,
        text: '',
        images: []
      };

      // Extract text
      if (extractText) {
        const textContent = await page.getTextContent();
        pageData.text = textContent.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Extract images
      if (extractImages) {
        const operatorList = await page.getOperatorList();
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        await page.render({ canvasContext: context, viewport }).promise;

        // Convert canvas to base64 image
        pageData.pageImage = canvas.toDataURL('image/png');

        // Also try to extract individual images
        pageData.images = await this._extractImages(page, operatorList);
      }

      pages.push(pageData);
    }

    return {
      numPages: totalPages,
      pages,
      metadata: await this._extractMetadata(pdf)
    };
  }

  async _extractImages(page, operatorList) {
    const images = [];

    try {
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (operatorList.fnArray[i] === this.pdfjsLib.OPS.paintImageXObject) {
          // Image detected
          const imageName = operatorList.argsArray[i][0];

          try {
            const imageObj = await page.objs.get(imageName);
            if (imageObj && imageObj.data) {
              // Convert image data to base64
              const canvas = document.createElement('canvas');
              canvas.width = imageObj.width;
              canvas.height = imageObj.height;
              const ctx = canvas.getContext('2d');

              const imageData = ctx.createImageData(imageObj.width, imageObj.height);
              imageData.data.set(imageObj.data);
              ctx.putImageData(imageData, 0, 0);

              images.push({
                name: imageName,
                data: canvas.toDataURL('image/png'),
                width: imageObj.width,
                height: imageObj.height
              });
            }
          } catch (e) {
            console.warn('Failed to extract image:', e);
          }
        }
      }
    } catch (error) {
      console.warn('Image extraction error:', error);
    }

    return images;
  }

  async _extractMetadata(pdf) {
    const metadata = await pdf.getMetadata();
    return {
      title: metadata.info?.Title || '',
      author: metadata.info?.Author || '',
      subject: metadata.info?.Subject || '',
      keywords: metadata.info?.Keywords || '',
      creationDate: metadata.info?.CreationDate || ''
    };
  }

  // Chunk text into smaller pieces for RAG
  chunkText(text, options = {}) {
    const maxChunkSize = options.maxChunkSize || 800;
    const overlap = options.overlap || 100;
    const chunks = [];

    // Split by sentences first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let currentChunk = '';
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceSize = sentence.length;

      if (currentSize + sentenceSize > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());

        // Add overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + ' ';
        currentSize = currentChunk.length;
      }

      currentChunk += sentence;
      currentSize += sentenceSize;
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Detect math-related content
  identifyMathContent(text) {
    const mathPatterns = [
      /\b(equation|formula|theorem|proof|polynomial|quadratic|linear)\b/gi,
      /\b(solve|simplify|factor|expand|calculate)\b/gi,
      /[a-z]\s*[\+\-\*\/=]\s*[a-z0-9]/gi,
      /\b(x|y|z)\^[0-9]/gi,
      /\b\d+x\b/gi
    ];

    const matches = mathPatterns.reduce((count, pattern) => {
      const found = text.match(pattern);
      return count + (found ? found.length : 0);
    }, 0);

    return {
      isMathContent: matches > 3,
      confidence: Math.min(matches / 10, 1),
      matches
    };
  }

  // Extract section headers (common in textbooks)
  extractSections(pages) {
    const sections = [];

    for (const page of pages) {
      const lines = page.text.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect section headers (all caps, numbers, or short lines)
        if (this._isSectionHeader(line)) {
          sections.push({
            title: line,
            pageNumber: page.pageNumber,
            content: this._extractSectionContent(lines, i + 1)
          });
        }
      }
    }

    return sections;
  }

  _isSectionHeader(line) {
    if (!line || line.length > 100) return false;

    const headerPatterns = [
      /^[0-9]+\.[0-9]+/,  // 6.1, 6.2, etc.
      /^chapter\s+\d+/i,
      /^section\s+\d+/i,
      /^[A-Z][A-Z\s]+$/,  // ALL CAPS
    ];

    return headerPatterns.some(pattern => pattern.test(line));
  }

  _extractSectionContent(lines, startIdx) {
    const content = [];

    for (let i = startIdx; i < Math.min(startIdx + 10, lines.length); i++) {
      if (this._isSectionHeader(lines[i])) break;
      content.push(lines[i]);
    }

    return content.join(' ').trim();
  }
}

// Global instance
const pdfProcessor = new PDFProcessor();
