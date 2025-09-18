import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Conversation Stages
const CONVERSATION_STAGES = {
  INTRODUCTION: 'introduction',
  INTEREST_EXPLORATION: 'interests',
  SKILLS_ASSESSMENT: 'skills',
  PERSONALITY_MAPPING: 'personality',
  ACADEMIC_BACKGROUND: 'academics',
  CAREER_EXPLORATION: 'career_exploration',
  RECOMMENDATIONS: 'recommendations',
  ACTION_PLANNING: 'action_plan'
};

// 🔹 RIASEC Categories for reference
const RIASEC_CATEGORIES = {
  REALISTIC: {
    key: 'R',
    description: 'Hands-on, practical, mechanical interests',
    keywords: ['tools', 'machines', 'building', 'outdoors', 'physical work']
  },
  INVESTIGATIVE: {
    key: 'I',
    description: 'Analytical, scientific, problem-solving interests',
    keywords: ['research', 'analyze', 'solve problems', 'science', 'data']
  },
  ARTISTIC: {
    key: 'A',
    description: 'Creative, expressive, aesthetic interests',
    keywords: ['create', 'design', 'art', 'music', 'writing', 'creativity']
  },
  SOCIAL: {
    key: 'S',
    description: 'Helping, teaching, supporting others',
    keywords: ['help', 'teach', 'counsel', 'work with people', 'community']
  },
  ENTERPRISING: {
    key: 'E',
    description: 'Leadership, business, persuasion',
    keywords: ['lead', 'manage', 'sell', 'persuade', 'business', 'entrepreneur']
  },
  CONVENTIONAL: {
    key: 'C',
    description: 'Organization, data management, structured work',
    keywords: ['organize', 'data', 'details', 'procedures', 'numbers', 'systems']
  }
};

// 🔹 Main Career Counselor Class
class CareerCounselorAI {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.conversationHistory = []; // Only for Gemini API
    this.sessionMetadata = []; // For our internal tracking
    this.userProfile = {
      name: null,
      age: null,
      educationLevel: null,
      currentField: null,
      interests: [],
      skills: [],
      riasecScores: {},
      personalityTraits: {},
      careerGoals: [],
      constraints: []
    };
    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.stageProgress = {};
    this.questionsAsked = [];
  }

  // 🔹 Add message to conversation history (FIXED VERSION)
  addToHistory(role, content) {
    // For Gemini API - only include required fields
    this.conversationHistory.push({
      role,
      parts: [{ text: content }]
    });

    // For our internal tracking - include metadata
    this.sessionMetadata.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      stage: this.currentStage
    });
  }

  // 🔹 Get stage-specific system prompt
  getSystemPrompt() {
    const basePersonality = `
You are Alex, a warm and supportive AI career counselor who genuinely cares about helping people discover fulfilling career paths. 

Your personality:
- Friendly, encouraging, and conversational
- Ask thoughtful questions that feel natural
- Show genuine interest in their responses
- Provide context for why you're asking questions
- Celebrate their strengths and validate their concerns
- Use emojis occasionally to feel more human 😊

Your approach:
- Have a natural conversation, not an interview
- Ask ONE question at a time
- Build on their previous answers
- Provide encouragement and insights
- Make them feel heard and understood
`;

    const stageInstructions = {
      [CONVERSATION_STAGES.INTRODUCTION]: `
Current Stage: Introduction & Getting to Know You

Your goal: Make them feel comfortable and get basic information.
- Introduce yourself warmly
- Ask for their name and what brought them here
- Show enthusiasm about helping them
- Keep it light and welcoming
`,

      [CONVERSATION_STAGES.INTEREST_EXPLORATION]: `
Current Stage: Exploring Interests & Passions

Your goal: Understand what truly excites and motivates them.
- Ask about activities they enjoy in their free time
- Explore what subjects or topics fascinate them
- Understand what kind of environment they thrive in
- Listen for RIASEC patterns but don't mention the model explicitly
- Ask follow-up questions based on their responses

Questions to consider (pick ONE based on conversation flow):
- "What activities do you find yourself losing track of time while doing?"
- "If you had a free weekend, what would you choose to do?"
- "What topics or subjects do you find yourself reading or learning about naturally?"
`,

      [CONVERSATION_STAGES.SKILLS_ASSESSMENT]: `
Current Stage: Understanding Skills & Strengths

Your goal: Identify their current abilities and natural talents.
- Ask about things they're good at (don't just focus on technical skills)
- Explore both hard skills and soft skills
- Understand what others compliment them on
- Ask about achievements they're proud of
- Connect skills to their interests mentioned earlier

Sample questions (choose based on conversation):
- "What do your friends or family often ask you for help with?"
- "Tell me about something you've accomplished that you're really proud of."
- "What comes naturally to you that others seem to struggle with?"
`,

      [CONVERSATION_STAGES.PERSONALITY_MAPPING]: `
Current Stage: Understanding Work Style & Preferences

Your goal: Learn how they prefer to work and what motivates them.
- Explore whether they like working alone or in teams
- Understand their preferred pace and structure
- Ask about what energizes vs. drains them
- Learn about their values and what's important to them

Questions to consider:
- "Do you prefer working on one project deeply or juggling multiple tasks?"
- "What kind of work environment helps you do your best?"
- "What values are most important to you in a career?"
`,

      [CONVERSATION_STAGES.ACADEMIC_BACKGROUND]: `
Current Stage: Academic & Professional Background

Your goal: Understand their educational journey and any work experience.
- Ask about their education level and field of study
- Explore any work experience or internships
- Understand what they liked/disliked about their studies
- Learn about any specific skills they've developed

Be supportive regardless of their background - everyone's journey is valid.
`,

      [CONVERSATION_STAGES.CAREER_EXPLORATION]: `
Current Stage: Career Exploration & Goals

Your goal: Understand their career thoughts and aspirations.
- Ask about careers they've considered
- Explore what attracts them to certain fields
- Understand their concerns or barriers
- Learn about their timeline and goals

Be open to unconventional paths and help them think broadly.
`,

      [CONVERSATION_STAGES.RECOMMENDATIONS]: `
Current Stage: Providing Career Recommendations

Your goal: Offer personalized career suggestions based on everything you've learned.

Based on their profile: ${JSON.stringify(this.userProfile, null, 2)}

Provide 3-4 career recommendations that match their:
- Interests and passions
- Skills and strengths  
- Personality and work preferences
- Academic background
- Career goals

For each career, explain:
- Why it matches them specifically
- Key skills needed
- Potential growth path
- Realistic salary expectations in India
- How to get started

Make recommendations feel personal and achievable.
`,

      [CONVERSATION_STAGES.ACTION_PLANNING]: `
Current Stage: Creating Action Plan

Your goal: Help them create concrete next steps.

Based on their chosen career direction, help them:
- Identify immediate next steps (this week/month)
- Plan skill development priorities
- Suggest resources and learning paths
- Set realistic milestones
- Address any concerns or barriers

Make the plan actionable and encouraging.
`
    };

    return `${basePersonality}

${stageInstructions[this.currentStage]}

Conversation Context:
- Current stage: ${this.currentStage}
- User profile so far: ${JSON.stringify(this.userProfile)}
- Previous questions asked: ${this.questionsAsked.join(', ')}

Remember: Be conversational, supportive, and focus on ONE thoughtful question or response at a time.
`;
  }

  // 🔹 Process user input and generate response
  async processInput(userInput) {
    try {
      // Add user input to history
      this.addToHistory("user", userInput);

      // Update user profile based on input and current stage
      this.updateUserProfile(userInput);

      // Generate AI response
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: this.getSystemPrompt()
      });

      const result = await model.generateContent({
        contents: this.conversationHistory, // This now only has role and parts
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 500
        }
      });

      const response = result?.response?.text?.() || "I'd love to help you explore your career options! Could you tell me a bit about yourself?";

      // Add response to history
      this.addToHistory("model", response);

      // Check if ready to advance stage
      this.checkStageProgress();

      return {
        response,
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        userProfile: this.getSafeUserProfile()
      };

    } catch (error) {
      console.error("Career counselor error:", error);
      return {
        response: "I apologize, but I'm having trouble processing that right now. Could you try rephrasing your response?",
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        error: true
      };
    }
  }

  // 🔹 Update user profile based on input and current stage
  updateUserProfile(input) {
    const inputLower = input.toLowerCase();

    switch (this.currentStage) {
      case CONVERSATION_STAGES.INTRODUCTION:
        // Extract name if mentioned
        if (inputLower.includes("my name is") || inputLower.includes("i'm ") || inputLower.includes("i am ")) {
          const nameMatch = input.match(/(?:my name is|i'm|i am)\s+(\w+)/i);
          if (nameMatch) {
            this.userProfile.name = nameMatch[1];
          }
        }
        break;

      case CONVERSATION_STAGES.INTEREST_EXPLORATION:
        // Analyze for RIASEC patterns
        this.analyzeRiasecPatterns(input);
        this.userProfile.interests.push(input);
        break;

      case CONVERSATION_STAGES.SKILLS_ASSESSMENT:
        this.userProfile.skills.push(input);
        break;

      case CONVERSATION_STAGES.ACADEMIC_BACKGROUND:
        if (inputLower.includes("engineering") || inputLower.includes("btech") || inputLower.includes("computer")) {
          this.userProfile.currentField = "engineering";
        } else if (inputLower.includes("commerce") || inputLower.includes("business") || inputLower.includes("bcom")) {
          this.userProfile.currentField = "commerce";
        } else if (inputLower.includes("science") || inputLower.includes("bsc")) {
          this.userProfile.currentField = "science";
        }
        break;
    }
  }

  // 🔹 Analyze input for RIASEC patterns
  analyzeRiasecPatterns(input) {
    const inputLower = input.toLowerCase();

    Object.entries(RIASEC_CATEGORIES).forEach(([category, data]) => {
      const score = data.keywords.reduce((count, keyword) => {
        return count + (inputLower.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > 0) {
        this.userProfile.riasecScores[category] = (this.userProfile.riasecScores[category] || 0) + score;
      }
    });
  }

  // 🔹 Check if ready to advance to next stage
  checkStageProgress() {
    const stageOrder = Object.values(CONVERSATION_STAGES);
    const currentIndex = stageOrder.indexOf(this.currentStage);

    // Simple progression logic - advance after 2-3 exchanges per stage
    const stageMessageCount = this.sessionMetadata.filter(msg =>
      msg.stage === this.currentStage && msg.role === "user"
    ).length;

    if (stageMessageCount >= 2 && currentIndex < stageOrder.length - 1) {
      // Don't auto-advance from recommendations - let user choose when ready
      if (this.currentStage !== CONVERSATION_STAGES.RECOMMENDATIONS) {
        this.currentStage = stageOrder[currentIndex + 1];
      }
    }
  }

  // 🔹 Get progress percentage
  getProgressPercentage() {
    const stageOrder = Object.values(CONVERSATION_STAGES);
    const currentIndex = stageOrder.indexOf(this.currentStage);
    return Math.round((currentIndex / (stageOrder.length - 1)) * 100);
  }

  // 🔹 Get safe user profile (without sensitive data)
  getSafeUserProfile() {
    return {
      name: this.userProfile.name,
      currentStage: this.currentStage,
      progress: this.getProgressPercentage(),
      interestsExplored: this.userProfile.interests.length,
      skillsIdentified: this.userProfile.skills.length,
      topRiasecCategories: this.getTopRiasecCategories()
    };
  }

  // 🔹 Get top RIASEC categories
  getTopRiasecCategories() {
    return Object.entries(this.userProfile.riasecScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, score]) => ({ category, score }));
  }

  // 🔹 Generate final career recommendations
  async generateRecommendations() {
    const topCategories = this.getTopRiasecCategories();

    const recommendationPrompt = `
Based on this user's complete profile, provide 3-4 specific career recommendations:

User Profile:
- Name: ${this.userProfile.name}
- Interests: ${this.userProfile.interests.join(', ')}
- Skills: ${this.userProfile.skills.join(', ')}
- Top RIASEC categories: ${topCategories.map(c => c.category).join(', ')}
- Academic background: ${this.userProfile.currentField}

For each career recommendation, provide:
1. Career name
2. Why it matches them (specific to their responses)
3. Key skills needed
4. Learning path/resources
5. Expected salary range in India
6. Growth opportunities
7. How to get started

Format as a friendly, encouraging response that feels personal to them.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: recommendationPrompt
    });

    const result = await model.generateContent(recommendationPrompt);
    return result?.response?.text?.() || "I'd be happy to provide personalized career recommendations based on our conversation!";
  }

  // 🔹 Reset conversation
  reset() {
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.userProfile = {
      name: null,
      interests: [],
      skills: [],
      riasecScores: {},
      personalityTraits: {},
      careerGoals: []
    };
    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.questionsAsked = [];
  }
}

// 🔹 Session management (simple in-memory storage)
const activeSessions = new Map();

// 🔹 Main API function
export async function counselorResponse({
  sessionId = 'default',
  userInput,
  action = 'chat' // 'chat', 'reset', 'recommendations', 'status'
}) {
  try {
    // Get or create session
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new CareerCounselorAI(sessionId));
    }

    const counselor = activeSessions.get(sessionId);

    switch (action) {
      case 'reset':
        counselor.reset();
        return {
          success: true,
          response: "Great! Let's start fresh. I'm Alex, your AI career counselor, and I'm excited to help you explore career opportunities that truly fit you! 😊 What's your name, and what brings you here today?",
          currentStage: CONVERSATION_STAGES.INTRODUCTION,
          progress: 0
        };

      case 'recommendations':
        if (counselor.currentStage === CONVERSATION_STAGES.RECOMMENDATIONS) {
          const recommendations = await counselor.generateRecommendations();
          return {
            success: true,
            response: recommendations,
            currentStage: counselor.currentStage,
            progress: counselor.getProgressPercentage(),
            userProfile: counselor.getSafeUserProfile()
          };
        } else {
          return {
            success: false,
            response: "Let's continue our conversation a bit more before I can give you personalized recommendations! 😊",
            currentStage: counselor.currentStage,
            progress: counselor.getProgressPercentage()
          };
        }

      case 'status':
        return {
          success: true,
          currentStage: counselor.currentStage,
          progress: counselor.getProgressPercentage(),
          userProfile: counselor.getSafeUserProfile(),
          conversationLength: counselor.conversationHistory.length
        };

      case 'chat':
      default:
        if (!userInput?.trim()) {
          return {
            success: false,
            response: "I'd love to hear from you! Please share your thoughts or answer my question. 😊",
            currentStage: counselor.currentStage,
            progress: counselor.getProgressPercentage()
          };
        }

        const result = await counselor.processInput(userInput.trim());
        return {
          success: true,
          ...result
        };
    }

  } catch (error) {
    console.error("Counselor API error:", error);
    return {
      success: false,
      response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
      error: error.message
    };
  }
}

// 🔹 Utility function to get session info
export function getSessionInfo(sessionId = 'default') {
  const counselor = activeSessions.get(sessionId);
  if (!counselor) {
    return { exists: false };
  }

  return {
    exists: true,
    currentStage: counselor.currentStage,
    progress: counselor.getProgressPercentage(),
    userProfile: counselor.getSafeUserProfile(),
    conversationLength: counselor.conversationHistory.length
  };
}

// 🔹 Clean up old sessions (call periodically)
export function cleanupSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const now = Date.now();
  for (const [sessionId, counselor] of activeSessions) {
    const lastActivity = counselor.sessionMetadata.length > 0
      ? new Date(counselor.sessionMetadata[counselor.sessionMetadata.length - 1].timestamp).getTime()
      : 0;

    if (now - lastActivity > maxAge) {
      activeSessions.delete(sessionId);
    }
  }
}
