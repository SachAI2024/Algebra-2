// RAG Engine for Retrieval-Augmented Generation
// Handles content chunking, embedding, similarity search, and question generation

class RAGEngine {
  constructor() {
    this.chunks = [];
    this.embeddings = [];
    this.moduleData = {};
  }

  // Process uploaded PDF and create RAG index
  async processPDFForRAG(pdfFile, moduleId) {
    console.log(`Processing PDF for RAG: ${moduleId}`);

    // Extract content from PDF
    const pdfData = await pdfProcessor.processPDF(pdfFile, {
      extractText: true,
      extractImages: true
    });

    // Combine all page text
    const fullText = pdfData.pages.map(p => p.text).join('\n\n');

    // Chunk the text
    const textChunks = pdfProcessor.chunkText(fullText, {
      maxChunkSize: 800,
      overlap: 100
    });

    console.log(`Created ${textChunks.length} text chunks`);

    // Generate embeddings for chunks
    const embeddings = await aiService.generateEmbeddings(textChunks);

    console.log(`Generated ${embeddings.length} embeddings`);

    // Extract images with context
    const imageChunks = this._extractImageChunks(pdfData.pages);

    // Combine text and image chunks
    const allChunks = [
      ...textChunks.map((text, idx) => ({
        type: 'text',
        content: text,
        embedding: embeddings[idx],
        moduleId,
        pageNumber: this._findPageNumber(text, pdfData.pages),
        topic: aiService.extractTopic(text),
        mathScore: pdfProcessor.identifyMathContent(text).confidence
      })),
      ...imageChunks.map(img => ({
        type: 'image',
        content: img.description,
        image: img.data,
        embedding: null, // Can be added later
        moduleId,
        pageNumber: img.pageNumber
      }))
    ];

    // Store in memory and Firebase
    this.chunks = allChunks;
    this.embeddings = embeddings;

    const moduleContent = {
      moduleId,
      fileName: pdfFile.name,
      processedAt: Date.now(),
      chunks: allChunks,
      metadata: pdfData.metadata,
      stats: {
        totalChunks: allChunks.length,
        textChunks: textChunks.length,
        imageChunks: imageChunks.length,
        totalPages: pdfData.numPages
      }
    };

    this.moduleData[moduleId] = moduleContent;

    // Save to Firebase
    await firebaseService.saveContent(moduleId, moduleContent);

    return moduleContent;
  }

  _extractImageChunks(pages) {
    const imageChunks = [];

    for (const page of pages) {
      if (page.pageImage) {
        imageChunks.push({
          data: page.pageImage,
          pageNumber: page.pageNumber,
          description: `Diagram/graph from page ${page.pageNumber}`
        });
      }

      for (const img of page.images || []) {
        imageChunks.push({
          data: img.data,
          pageNumber: page.pageNumber,
          description: `Figure from page ${page.pageNumber}`
        });
      }
    }

    return imageChunks;
  }

  _findPageNumber(text, pages) {
    for (const page of pages) {
      if (page.text.includes(text.substring(0, 100))) {
        return page.pageNumber;
      }
    }
    return 1;
  }

  // Cosine similarity between two vectors
  _cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Retrieve relevant chunks for a query
  async retrieveRelevantChunks(query, options = {}) {
    const topK = options.topK || 3;
    const moduleId = options.moduleId;
    const minScore = options.minScore || 0.3;

    // Generate embedding for query
    const queryEmbedding = await aiService.generateEmbedding(query);

    // Filter chunks by module if specified
    let searchChunks = this.chunks;
    if (moduleId) {
      searchChunks = this.chunks.filter(c => c.moduleId === moduleId);
    }

    // Calculate similarities
    const scores = searchChunks
      .filter(chunk => chunk.embedding)
      .map(chunk => ({
        chunk,
        score: this._cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .filter(item => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scores.map(item => ({
      ...item.chunk,
      relevanceScore: item.score
    }));
  }

  // Generate a question based on module content
  async generateQuestion(moduleId, difficulty, previousTopics = []) {
    // Load module if not in memory
    if (!this.moduleData[moduleId]) {
      const data = await firebaseService.getContent(moduleId);
      if (data) {
        this.moduleData[moduleId] = data;
        this.chunks = data.chunks || [];
      } else {
        throw new Error(`Module ${moduleId} not found`);
      }
    }

    // Get chunks for this module with high math score
    const moduleChunks = this.chunks
      .filter(c => c.moduleId === moduleId && c.type === 'text' && c.mathScore > 0.3)
      .filter(c => !previousTopics.includes(c.topic)); // Avoid repetition

    if (moduleChunks.length === 0) {
      throw new Error('No suitable content found for question generation');
    }

    // Pick a random chunk weighted by math score
    const selectedChunk = this._weightedRandomPick(moduleChunks, 'mathScore');

    // Generate question using AI
    const question = await aiService.generateQuestion(
      selectedChunk.content,
      difficulty,
      selectedChunk.topic
    );

    return {
      ...question,
      topic: selectedChunk.topic,
      moduleId,
      difficulty,
      sourceChunk: selectedChunk.content.substring(0, 200) + '...',
      pageNumber: selectedChunk.pageNumber
    };
  }

  _weightedRandomPick(items, weightKey) {
    const totalWeight = items.reduce((sum, item) => sum + (item[weightKey] || 1), 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      random -= item[weightKey] || 1;
      if (random <= 0) return item;
    }

    return items[items.length - 1];
  }

  // Get module statistics
  getModuleStats(moduleId) {
    const data = this.moduleData[moduleId];
    if (!data) return null;

    const topics = {};
    const chunks = data.chunks || [];

    chunks.forEach(chunk => {
      if (chunk.topic) {
        topics[chunk.topic] = (topics[chunk.topic] || 0) + 1;
      }
    });

    return {
      totalChunks: chunks.length,
      topics: Object.keys(topics).map(topic => ({
        name: topic,
        count: topics[topic]
      })),
      fileName: data.fileName,
      processedAt: data.processedAt,
      stats: data.stats
    };
  }

  // Load all modules from Firebase
  async loadAllModules() {
    const modules = await firebaseService.getAllModules();

    modules.forEach(module => {
      this.moduleData[module.id] = module;
      if (module.chunks) {
        this.chunks.push(...module.chunks);
      }
    });

    console.log(`Loaded ${modules.length} modules with ${this.chunks.length} total chunks`);

    return modules;
  }

  // Search across all modules
  async searchContent(query, options = {}) {
    const results = await this.retrieveRelevantChunks(query, options);

    return results.map(chunk => ({
      moduleId: chunk.moduleId,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      topic: chunk.topic,
      score: chunk.relevanceScore,
      type: chunk.type
    }));
  }

  // Get practice problems for a specific topic
  async getPracticeProblems(topic, difficulty, count = 4) {
    // Find relevant chunks about this topic
    const relevantChunks = this.chunks.filter(
      c => c.topic === topic && c.type === 'text'
    ).slice(0, 2);

    const context = relevantChunks
      .map(c => c.content)
      .join('\n\n')
      .substring(0, 500);

    // Generate practice problems using AI
    const problems = await aiService.generatePracticeProblems(topic, count);

    return problems;
  }

  // Clear cache
  clearCache() {
    this.chunks = [];
    this.embeddings = [];
    this.moduleData = {};
  }
}

// Global instance
const ragEngine = new RAGEngine();
