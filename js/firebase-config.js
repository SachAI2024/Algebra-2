// Firebase Configuration and Initialization
// Replace with your Firebase project config from Firebase Console

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.storage = null;
  }

  async init() {
    if (this.initialized) return;

    try {
      // Initialize Firebase (assumes Firebase SDK loaded via CDN)
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded. Include Firebase scripts in HTML.');
      }

      firebase.initializeApp(firebaseConfig);
      this.db = firebase.firestore();
      this.storage = firebase.storage();
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      // Fallback to localStorage if Firebase fails
      this.useFallback = true;
    }
  }

  // Upload PDF file to Firebase Storage
  async uploadPDF(file, moduleId) {
    if (this.useFallback) {
      return this._uploadPDFLocal(file, moduleId);
    }

    const storageRef = this.storage.ref();
    const pdfRef = storageRef.child(`pdfs/${moduleId}/${file.name}`);

    const snapshot = await pdfRef.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return {
      url: downloadURL,
      name: file.name,
      size: file.size,
      uploadedAt: Date.now()
    };
  }

  // Save extracted content to Firestore
  async saveContent(moduleId, content) {
    if (this.useFallback) {
      return this._saveContentLocal(moduleId, content);
    }

    await this.db.collection('modules').doc(moduleId).set({
      ...content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // Get module content
  async getContent(moduleId) {
    if (this.useFallback) {
      return this._getContentLocal(moduleId);
    }

    const doc = await this.db.collection('modules').doc(moduleId).get();
    return doc.exists ? doc.data() : null;
  }

  // Save user session data
  async saveSession(userId, sessionData) {
    if (this.useFallback) {
      return this._saveSessionLocal(userId, sessionData);
    }

    await this.db.collection('sessions').add({
      userId,
      ...sessionData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Get all modules
  async getAllModules() {
    if (this.useFallback) {
      return this._getAllModulesLocal();
    }

    const snapshot = await this.db.collection('modules').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // LocalStorage fallback methods
  _uploadPDFLocal(file, moduleId) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = {
          url: e.target.result,
          name: file.name,
          size: file.size,
          uploadedAt: Date.now()
        };
        localStorage.setItem(`pdf_${moduleId}`, JSON.stringify(data));
        resolve(data);
      };
      reader.readAsDataURL(file);
    });
  }

  _saveContentLocal(moduleId, content) {
    localStorage.setItem(`module_${moduleId}`, JSON.stringify({
      ...content,
      updatedAt: Date.now()
    }));
  }

  _getContentLocal(moduleId) {
    const data = localStorage.getItem(`module_${moduleId}`);
    return data ? JSON.parse(data) : null;
  }

  _saveSessionLocal(userId, sessionData) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push({ userId, ...sessionData, createdAt: Date.now() });
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }

  _getAllModulesLocal() {
    const modules = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('module_')) {
        const id = key.replace('module_', '');
        modules.push({ id, ...JSON.parse(localStorage.getItem(key)) });
      }
    }
    return modules;
  }
}

// Global instance
const firebaseService = new FirebaseService();
