// Session Manager for Adaptive Learning
// Handles timed sessions, difficulty adaptation, attempts, and analytics

class SessionManager {
  constructor() {
    this.session = null;
    this.timer = null;
    this.questionTimers = [];
  }

  // Start a new practice session
  startSession(config = {}) {
    this.session = {
      id: 'session_' + Date.now(),
      userId: config.userId || 'student',
      moduleId: config.moduleId,
      startTime: Date.now(),
      endTime: null,
      duration: config.duration || 20 * 60 * 1000, // 20 minutes default
      targetQuestions: config.targetQuestions || 10,

      // Current state
      currentQuestionIndex: 0,
      difficulty: config.initialDifficulty || 1,
      streak: 0,

      // Questions and answers
      questions: [],
      answers: [],
      questionStartTime: null,

      // Statistics
      stats: {
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalAttempts: 0,
        timePerQuestion: [],
        difficultyProgression: [config.initialDifficulty || 1],
        topicsCorved: new Set()
      },

      // Adaptive learning
      adaptiveParams: {
        streakToLevelUp: 2,
        fastThresholdMs: 45000, // 45 seconds considered "fast"
        levelUpOnFastStreak: true,
        maxDifficulty: 4,
        minDifficulty: 1
      }
    };

    // Start timer
    this._startTimer();

    return this.session;
  }

  _startTimer() {
    const endTime = this.session.startTime + this.session.duration;

    this.timer = setInterval(() => {
      const remaining = endTime - Date.now();

      if (remaining <= 0) {
        this.endSession();
      }

      // Emit time update event
      window.dispatchEvent(new CustomEvent('session-time-update', {
        detail: { remaining, elapsed: Date.now() - this.session.startTime }
      }));
    }, 1000);
  }

  // Get next question
  async getNextQuestion() {
    if (!this.session) {
      throw new Error('No active session');
    }

    // Check if session should end
    if (this.session.currentQuestionIndex >= this.session.targetQuestions) {
      this.endSession();
      return null;
    }

    // Start question timer
    this.session.questionStartTime = Date.now();

    // Generate question with current difficulty
    const question = await ragEngine.generateQuestion(
      this.session.moduleId,
      this.session.difficulty,
      Array.from(this.session.stats.topicsCorved)
    );

    // Add to questions list
    this.session.questions.push({
      ...question,
      index: this.session.currentQuestionIndex,
      startTime: this.session.questionStartTime,
      attempts: [],
      attemptsRemaining: 3,
      completed: false
    });

    this.session.stats.topicsCorved.add(question.topic);

    return this.getCurrentQuestion();
  }

  getCurrentQuestion() {
    return this.session.questions[this.session.currentQuestionIndex];
  }

  // Submit answer for current question
  async submitAnswer(selectedIndex) {
    if (!this.session) {
      throw new Error('No active session');
    }

    const question = this.getCurrentQuestion();
    if (!question || question.completed) {
      throw new Error('No active question');
    }

    const answerTime = Date.now();
    const timeSpent = answerTime - this.session.questionStartTime;
    const isCorrect = selectedIndex === question.correctIndex;

    // Record attempt
    question.attempts.push({
      selectedIndex,
      isCorrect,
      timeSpent,
      timestamp: answerTime
    });

    question.attemptsRemaining--;
    this.session.stats.totalAttempts++;

    const result = {
      isCorrect,
      attemptsRemaining: question.attemptsRemaining,
      timeSpent,
      fastAnswer: timeSpent < this.session.adaptiveParams.fastThresholdMs
    };

    if (isCorrect) {
      // Correct answer
      question.completed = true;
      this.session.stats.correctAnswers++;
      this.session.streak++;

      // Record time for analytics
      this.session.stats.timePerQuestion.push({
        questionIndex: this.session.currentQuestionIndex,
        time: timeSpent,
        difficulty: this.session.difficulty,
        topic: question.topic
      });

      // Adaptive difficulty adjustment
      this._adjustDifficulty(true, result.fastAnswer);

      result.feedback = 'Correct! Well done.';
      result.nextAction = 'next_question';

    } else if (question.attemptsRemaining > 0) {
      // Incorrect but has attempts left
      result.feedback = `Incorrect. ${question.attemptsRemaining} attempts remaining.`;
      result.nextAction = 'retry';

    } else {
      // Failed all 3 attempts
      question.completed = true;
      this.session.stats.incorrectAnswers++;
      this.session.streak = 0;

      // Adjust difficulty down
      this._adjustDifficulty(false, false);

      // Generate explanation and practice problems
      result.feedback = 'All attempts used. Let\'s learn from this!';
      result.nextAction = 'show_explanation';
      result.explanation = await this._generateExplanation(question, selectedIndex);
      result.practiceProblems = await ragEngine.getPracticeProblems(
        question.topic,
        Math.max(1, this.session.difficulty - 1),
        4
      );
    }

    // Save session progress
    this._saveSessionProgress();

    return result;
  }

  _adjustDifficulty(correct, fast) {
    const params = this.session.adaptiveParams;

    if (correct) {
      // Increase difficulty if on a streak and (fast or streak is long)
      if (this.session.streak >= params.streakToLevelUp) {
        if (fast && params.levelUpOnFastStreak) {
          this.session.difficulty = Math.min(
            params.maxDifficulty,
            this.session.difficulty + 1
          );
          this.session.streak = 0; // Reset streak after level up
        } else if (this.session.streak >= params.streakToLevelUp + 1) {
          // Level up even if not fast after longer streak
          this.session.difficulty = Math.min(
            params.maxDifficulty,
            this.session.difficulty + 1
          );
          this.session.streak = 0;
        }
      }
    } else {
      // Decrease difficulty on failure
      this.session.difficulty = Math.max(
        params.minDifficulty,
        this.session.difficulty - 1
      );
    }

    // Track difficulty progression
    this.session.stats.difficultyProgression.push(this.session.difficulty);
  }

  async _generateExplanation(question, wrongIndex) {
    const userAnswer = question.options[wrongIndex];
    const correctAnswer = question.options[question.correctIndex];

    const explanation = await aiService.explainMistake(
      question.question,
      userAnswer,
      correctAnswer,
      question.sourceChunk || ''
    );

    return {
      correctAnswer,
      solution: question.solution,
      whyWrong: explanation,
      keyTakeaway: 'Review the concept and try the practice problems below.'
    };
  }

  // Move to next question
  nextQuestion() {
    if (!this.session) return;

    this.session.currentQuestionIndex++;
    this.session.questionStartTime = Date.now();
  }

  // End session and generate report
  async endSession() {
    if (!this.session) return null;

    clearInterval(this.timer);
    this.session.endTime = Date.now();

    const totalTime = this.session.endTime - this.session.startTime;
    const avgTimePerQuestion = this.session.stats.timePerQuestion.length > 0
      ? this.session.stats.timePerQuestion.reduce((sum, q) => sum + q.time, 0) / this.session.stats.timePerQuestion.length
      : 0;

    // Find slow questions
    const slowQuestions = this.session.stats.timePerQuestion
      .filter(q => q.time > avgTimePerQuestion * 1.5)
      .sort((a, b) => b.time - a.time);

    // Calculate accuracy
    const accuracy = this.session.stats.totalQuestions > 0
      ? (this.session.stats.correctAnswers / this.session.stats.totalQuestions) * 100
      : 0;

    const report = {
      sessionId: this.session.id,
      userId: this.session.userId,
      moduleId: this.session.moduleId,

      // Time stats
      totalTime: Math.round(totalTime / 1000), // seconds
      avgTimePerQuestion: Math.round(avgTimePerQuestion / 1000),

      // Performance stats
      totalQuestions: this.session.questions.length,
      correctAnswers: this.session.stats.correctAnswers,
      incorrectAnswers: this.session.stats.incorrectAnswers,
      accuracy: Math.round(accuracy),
      totalAttempts: this.session.stats.totalAttempts,

      // Difficulty progression
      startDifficulty: this.session.stats.difficultyProgression[0],
      endDifficulty: this.session.stats.difficultyProgression[this.session.stats.difficultyProgression.length - 1],
      difficultyChart: this.session.stats.difficultyProgression,

      // Topics covered
      topicsCovered: Array.from(this.session.stats.topicsCorved),

      // Timing analysis
      slowQuestions: slowQuestions.map(q => ({
        questionNumber: q.questionIndex + 1,
        topic: q.topic,
        timeTaken: Math.round(q.time / 1000),
        difficulty: q.difficulty
      })),

      // Recommendations
      recommendations: this._generateRecommendations(slowQuestions, accuracy)
    };

    // Save to Firebase
    await firebaseService.saveSession(this.session.userId, report);

    const completedSession = this.session;
    this.session = null;

    return { report, session: completedSession };
  }

  _generateRecommendations(slowQuestions, accuracy) {
    const recommendations = [];

    // Time recommendations
    if (slowQuestions.length > 0) {
      const topSlow = slowQuestions[0];
      recommendations.push({
        type: 'timing',
        priority: 'high',
        message: `You spent ${topSlow.timeTaken}s on a ${topSlow.topic} question. Practice similar problems to improve speed.`,
        action: 'practice',
        topic: topSlow.topic
      });
    }

    // Accuracy recommendations
    if (accuracy < 50) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: 'Focus on understanding core concepts before attempting timed sessions.',
        action: 'review',
        suggestion: 'Try Learn mode instead of Practice mode'
      });
    } else if (accuracy >= 80) {
      recommendations.push({
        type: 'accuracy',
        priority: 'medium',
        message: 'Great job! Consider challenging yourself with harder problems.',
        action: 'level_up'
      });
    }

    // General tips
    recommendations.push({
      type: 'general',
      priority: 'low',
      message: 'Regular practice is key. Try to do at least one session per day.',
      action: 'schedule'
    });

    return recommendations;
  }

  _saveSessionProgress() {
    // Save to localStorage for recovery
    localStorage.setItem('current_session', JSON.stringify({
      id: this.session.id,
      progress: {
        currentQuestionIndex: this.session.currentQuestionIndex,
        difficulty: this.session.difficulty,
        streak: this.session.streak,
        stats: this.session.stats
      },
      savedAt: Date.now()
    }));
  }

  // Get session statistics
  getSessionStats() {
    if (!this.session) return null;

    const elapsed = Date.now() - this.session.startTime;
    const remaining = Math.max(0, this.session.duration - elapsed);

    return {
      elapsed: Math.round(elapsed / 1000),
      remaining: Math.round(remaining / 1000),
      questionsCompleted: this.session.currentQuestionIndex,
      questionsTotal: this.session.targetQuestions,
      currentDifficulty: this.session.difficulty,
      streak: this.session.streak,
      accuracy: this.session.stats.totalQuestions > 0
        ? Math.round((this.session.stats.correctAnswers / this.session.stats.totalQuestions) * 100)
        : 0
    };
  }

  // Pause/Resume timer
  pauseTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.session.pausedAt = Date.now();
    }
  }

  resumeTimer() {
    if (this.session && this.session.pausedAt) {
      const pauseDuration = Date.now() - this.session.pausedAt;
      this.session.startTime += pauseDuration;
      delete this.session.pausedAt;
      this._startTimer();
    }
  }
}

// Global instance
const sessionManager = new SessionManager();
