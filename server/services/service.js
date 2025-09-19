import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Tavily Search Function
async function searchWeb(query, options = {}) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        search_depth: options.depth || 'basic', // basic = 1 credit, advanced = 2 credits
        topic: options.topic || 'general', // general, news, finance
        max_results: options.maxResults || 5,
        include_answer: true, // Get AI-generated summary
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || [],
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      results: data.results?.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0
      })) || [],
      answer: data.answer || null,
      query: data.query,
      responseTime: data.response_time
    };
  } catch (error) {
    console.error('Tavily search error:', error);
    return { results: [], answer: null, error: error.message };
  }
}

// 🔹 Function Declarations for Gemini
const TOOL_FUNCTIONS = [
  {
    name: "search_career_info",
    description: "Search for current information about careers, job market trends, salary data, and skill requirements in India. Use this when you need fresh data about specific careers or job market conditions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for career-related information (e.g., 'software engineer salary India 2025', 'data scientist job market trends India')"
        },
        topic: {
          type: "string",
          enum: ["general", "news", "finance"],
          description: "Search topic category - use 'general' for career info, 'news' for latest trends, 'finance' for salary data"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_education_paths",
    description: "Search for current information about educational courses, certifications, universities, and learning paths for specific careers in India.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for educational information (e.g., 'best computer science colleges India', 'digital marketing certification courses 2025')"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_job_opportunities",
    description: "Search for current job market information, company hiring trends, and employment opportunities in specific fields in India.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for job opportunities (e.g., 'tech companies hiring freshers India', 'remote work opportunities data science')"
        }
      },
      required: ["query"]
    }
  }
];

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

// 🔹 Enhanced RIASEC Categories with Indian career mappings
const RIASEC_CATEGORIES = {
  REALISTIC: {
    key: 'R',
    description: 'Hands-on, practical, mechanical interests',
    keywords: ['tools', 'machines', 'building', 'outdoors', 'physical work', 'engineering', 'manufacturing'],
    indianCareers: ['Civil Engineer', 'Mechanical Engineer', 'Technician', 'Electrician', 'Architect']
  },
  INVESTIGATIVE: {
    key: 'I',
    description: 'Analytical, scientific, problem-solving interests',
    keywords: ['research', 'analyze', 'solve problems', 'science', 'data', 'technology', 'programming'],
    indianCareers: ['Software Engineer', 'Data Scientist', 'Research Scientist', 'Doctor', 'Biotechnology Specialist']
  },
  ARTISTIC: {
    key: 'A',
    description: 'Creative, expressive, aesthetic interests',
    keywords: ['create', 'design', 'art', 'music', 'writing', 'creativity', 'media'],
    indianCareers: ['Graphic Designer', 'Content Creator', 'Filmmaker', 'Fashion Designer', 'Interior Designer']
  },
  SOCIAL: {
    key: 'S',
    description: 'Helping, teaching, supporting others',
    keywords: ['help', 'teach', 'counsel', 'work with people', 'community', 'social work'],
    indianCareers: ['Teacher', 'Social Worker', 'Counselor', 'HR Manager', 'NGO Worker']
  },
  ENTERPRISING: {
    key: 'E',
    description: 'Leadership, business, persuasion',
    keywords: ['lead', 'manage', 'sell', 'persuade', 'business', 'entrepreneur', 'startup'],
    indianCareers: ['Business Manager', 'Sales Executive', 'Entrepreneur', 'Marketing Manager', 'Investment Banker']
  },
  CONVENTIONAL: {
    key: 'C',
    description: 'Organization, data management, structured work',
    keywords: ['organize', 'data', 'details', 'procedures', 'numbers', 'systems', 'admin'],
    indianCareers: ['Accountant', 'Data Analyst', 'Banking Professional', 'Administrative Officer', 'Quality Analyst']
  }
};

// 🔹 Enhanced Career Counselor Class
class CareerCounselorAI {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.searchResults = []; // Store search results for context
    this.userProfile = {
      name: null,
      age: null,
      location: 'India', // Default to India
      educationLevel: null,
      currentField: null,
      interests: [],
      skills: [],
      riasecScores: {},
      personalityTraits: {},
      careerGoals: [],
      constraints: [],
      preferredWorkStyle: null,
      salaryExpectations: null
    };
    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.stageProgress = {};
    this.questionsAsked = [];
  }

  // 🔹 Execute function calls
  async executeFunctionCall(functionCall) {
    const { name, args } = functionCall;
    console.log('function call-------------->')
    try {
      switch (name) {
        case 'search_career_info':
          const careerResults = await searchWeb(args.query, {
            topic: args.topic || 'general',
            maxResults: 5
          });
          this.searchResults.push({ type: 'career', query: args.query, results: careerResults });
          return careerResults;

        case 'search_education_paths':
          const eduResults = await searchWeb(args.query, {
            topic: 'general',
            maxResults: 5
          });
          this.searchResults.push({ type: 'education', query: args.query, results: eduResults });
          return eduResults;

        case 'search_job_opportunities':
          const jobResults = await searchWeb(args.query, {
            topic: 'news',
            maxResults: 5
          });
          this.searchResults.push({ type: 'jobs', query: args.query, results: jobResults });
          return jobResults;

        default:
          return { error: `Unknown function: ${name}` };
      }
    } catch (error) {
      console.error(`Function ${name} error:`, error);
      return { error: error.message };
    }
  }

  // 🔹 Enhanced system prompt with web search capabilities
  getSystemPrompt() {
    const basePersonality = `
You are Eve, an advanced AI career counselor specializing in the Indian job market. You have access to real-time web search tools to provide the most current career advice, salary information, and job market trends.

Your enhanced capabilities:
- Access to live job market data and salary trends in India
- Current information about educational institutions and certification programs
- Real-time updates on industry demands and skill requirements
- Fresh data about emerging careers and opportunities

Your personality:
- Warm, supportive, and genuinely invested in their success
- Data-driven but personable - use current market insights to back your advice
- Culturally aware of Indian education system and career paths
- Ask thoughtful questions and provide actionable guidance
- Use emojis to feel more human 😊

IMPORTANT: When you need current information about careers, salaries, job markets, or education options, use the available search functions. Always ground your recommendations in fresh, real-world data.
`;

    const stageInstructions = {
      [CONVERSATION_STAGES.INTRODUCTION]: `
Current Stage: Introduction & Getting to Know You

Your goal: Make them comfortable and understand their background.
- Introduce yourself warmly as an AI career counselor with access to current market data
- Ask for their name, age, and current location in India
- Understand what brought them to seek career guidance
- Show enthusiasm about helping them with data-driven insights
`,

      [CONVERSATION_STAGES.INTEREST_EXPLORATION]: `
Current Stage: Exploring Interests & Passions

Your goal: Deeply understand what motivates and excites them.
- Ask about activities that make them lose track of time
- Explore subjects they're naturally curious about
- Understand their ideal work environment and lifestyle
- Listen for RIASEC patterns and emerging career interests
- Use search tools when they mention specific fields to get current market insights

Example: If they mention "technology" or "programming," search for current tech trends in India.
`,

      [CONVERSATION_STAGES.SKILLS_ASSESSMENT]: `
Current Stage: Understanding Skills & Strengths

Your goal: Identify their current abilities and potential.
- Ask about academic strengths and achievements
- Explore both technical and soft skills
- Understand what others seek their help with
- Identify transferable skills they may not recognize
- When specific skills are mentioned, search for their market demand in India
`,

      [CONVERSATION_STAGES.PERSONALITY_MAPPING]: `
Current Stage: Understanding Work Style & Values

Your goal: Learn how they prefer to work and what drives them.
- Explore team vs individual work preferences
- Understand their values (stability, creativity, impact, money, etc.)
- Ask about ideal work-life balance
- Learn about their risk tolerance for entrepreneurship
- Understand salary expectations and financial goals
`,

      [CONVERSATION_STAGES.ACADEMIC_BACKGROUND]: `
Current Stage: Academic & Professional Background

Your goal: Understand their educational journey and experience.
- Ask about their current education level and field
- Explore any work experience, internships, or projects
- Understand their academic performance and favorite subjects
- Learn about any additional skills or certifications
- When they mention their field, search for current career prospects in that area
`,

      [CONVERSATION_STAGES.CAREER_EXPLORATION]: `
Current Stage: Career Exploration & Market Reality

Your goal: Explore career interests while providing market insights.
- Ask about careers they've considered or heard about
- Use search tools to provide current salary ranges and job availability
- Explore both traditional and emerging career paths
- Discuss the reality of different career options in the Indian context
- Help them understand growth prospects in various fields

IMPORTANT: Use search functions to get current data about any careers they mention.
`,

      [CONVERSATION_STAGES.RECOMMENDATIONS]: `
Current Stage: Data-Driven Career Recommendations

Your goal: Provide personalized, research-backed career suggestions.

User Profile: ${JSON.stringify(this.userProfile, null, 2)}
Recent Search Results: ${JSON.stringify(this.searchResults.slice(-3), null, 2)}

For each career recommendation:
1. Search for current salary data and job market trends
2. Find educational pathways and certification requirements
3. Look up current job opportunities and hiring trends
4. Provide specific, actionable advice based on real data

Provide 3-4 carefully researched recommendations with:
- Why it matches their profile specifically
- Current salary ranges in India (use search tool)
- Required skills and how to develop them
- Educational pathways (use search tool)
- Current job market status (use search tool)
- Specific next steps to get started
`,

      [CONVERSATION_STAGES.ACTION_PLANNING]: `
Current Stage: Creating Your Personalized Action Plan

Your goal: Help them create a concrete, step-by-step plan.

Based on their career choice, search for:
- Current certification programs and courses
- Top educational institutions offering relevant programs
- Entry-level job opportunities in their chosen field
- Skill development resources and timelines
- Networking opportunities and professional communities

Create a 30-60-90 day action plan with specific, researched recommendations.
`
    };

    return `${basePersonality}

${stageInstructions[this.currentStage]}

Current Context:
- User Profile: ${JSON.stringify(this.userProfile)}
- Stage: ${this.currentStage}
- Previous Questions: ${this.questionsAsked.join(', ')}

Remember: Use the search tools frequently to provide current, accurate information about the Indian job market, salaries, and opportunities. Always back your advice with real data when possible.
`;
  }

  // 🔹 Enhanced process input with function calling
  async processInput(userInput) {
    try {
      this.addToHistory("user", userInput);
      this.updateUserProfile(userInput);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: this.getSystemPrompt(),
        tools: [{ functionDeclarations: TOOL_FUNCTIONS }]
      });

      let response;
      let finalResponse = "";
      let searchResults = [];

      // First call to get response (may include function calls)
      const result = await model.generateContent({
        contents: this.conversationHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 800
        }
      });

      response = result.response;

      // Handle function calls if present
      if (response.candidates?.[0]?.content?.parts?.some(part => part.functionCall)) {
        const functionCalls = response.candidates[0].content.parts.filter(part => part.functionCall);

        // Execute each function call
        for (const part of functionCalls) {
          if (part.functionCall) {
            const searchResult = await this.executeFunctionCall(part.functionCall);
            searchResults.push(searchResult);

            // Add function response to conversation
            this.conversationHistory.push({
              role: "model",
              parts: [{ functionCall: part.functionCall }]
            });

            this.conversationHistory.push({
              role: "user",
              parts: [{ functionResponse: { name: part.functionCall.name, response: searchResult } }]
            });
          }
        }

        // Generate final response with function results
        const finalResult = await model.generateContent({
          contents: this.conversationHistory,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.9,
            maxOutputTokens: 800
          }
        });

        finalResponse = finalResult?.response?.text?.() || "I'd love to help you explore career options based on current market data!";
      } else {
        finalResponse = response?.text?.() || "I'd love to help you explore your career options!";
      }

      this.addToHistory("model", finalResponse);
      this.checkStageProgress();

      return {
        response: finalResponse,
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        userProfile: this.getSafeUserProfile(),
        searchResults: searchResults.length > 0 ? searchResults : undefined
      };

    } catch (error) {
      console.error("Career counselor error:", error);
      return {
        response: "I apologize, but I'm having trouble accessing current market data right now. Let me help you with the information I have available.",
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        error: true
      };
    }
  }

  // 🔹 Enhanced user profile update
  updateUserProfile(input) {
    const inputLower = input.toLowerCase();

    // Extract name
    if (inputLower.includes("my name is") || inputLower.includes("i'm ") || inputLower.includes("i am ")) {
      const nameMatch = input.match(/(?:my name is|i'm|i am)\s+(\w+)/i);
      if (nameMatch) this.userProfile.name = nameMatch[1];
    }

    // Extract age
    const ageMatch = input.match(/(?:i am|i'm|age)\s*(\d{1,2})\s*(?:years?|yr)/i);
    if (ageMatch) this.userProfile.age = parseInt(ageMatch[1]);

    // Extract location
    const locationPatterns = [
      /from\s+([a-zA-Z\s]+(?:,\s*[a-zA-Z\s]+)?)/i,
      /in\s+([a-zA-Z\s]+(?:,\s*[a-zA-Z\s]+)?)\s*(?:city|state)/i,
      /live\s+in\s+([a-zA-Z\s]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = input.match(pattern);
      if (match) {
        this.userProfile.location = match[1].trim();
        break;
      }
    }

    // Stage-specific updates
    switch (this.currentStage) {
      case CONVERSATION_STAGES.INTEREST_EXPLORATION:
        this.analyzeRiasecPatterns(input);
        this.userProfile.interests.push(input);
        break;

      case CONVERSATION_STAGES.SKILLS_ASSESSMENT:
        this.userProfile.skills.push(input);
        break;

      case CONVERSATION_STAGES.PERSONALITY_MAPPING:
        // Extract work style preferences
        if (inputLower.includes("team") || inputLower.includes("group")) {
          this.userProfile.preferredWorkStyle = "collaborative";
        } else if (inputLower.includes("alone") || inputLower.includes("independent")) {
          this.userProfile.preferredWorkStyle = "independent";
        }

        // Extract salary expectations
        const salaryMatch = input.match(/(\d+)\s*(?:lakh|k|thousand|crore)/i);
        if (salaryMatch) {
          this.userProfile.salaryExpectations = salaryMatch[0];
        }
        break;

      case CONVERSATION_STAGES.ACADEMIC_BACKGROUND:
        // Enhanced field detection
        const fields = {
          engineering: ['engineering', 'btech', 'be', 'computer science', 'mechanical', 'electrical', 'civil'],
          commerce: ['commerce', 'bcom', 'business', 'economics', 'finance', 'accounting'],
          science: ['science', 'bsc', 'physics', 'chemistry', 'biology', 'mathematics'],
          arts: ['arts', 'ba', 'humanities', 'literature', 'history', 'psychology'],
          medical: ['medical', 'mbbs', 'medicine', 'doctor', 'health', 'nursing'],
          law: ['law', 'llb', 'legal', 'lawyer'],
          management: ['mba', 'management', 'business administration']
        };

        for (const [field, keywords] of Object.entries(fields)) {
          if (keywords.some(keyword => inputLower.includes(keyword))) {
            this.userProfile.currentField = field;
            break;
          }
        }
        break;
    }
  }

  // 🔹 Enhanced RIASEC analysis
  analyzeRiasecPatterns(input) {
    const inputLower = input.toLowerCase();

    Object.entries(RIASEC_CATEGORIES).forEach(([category, data]) => {
      const score = data.keywords.reduce((count, keyword) => {
        return count + (inputLower.includes(keyword) ? 2 : 0) +
          (inputLower.split(' ').includes(keyword) ? 1 : 0);
      }, 0);

      if (score > 0) {
        this.userProfile.riasecScores[category] = (this.userProfile.riasecScores[category] || 0) + score;
      }
    });
  }

  // 🔹 Enhanced stage progression
  checkStageProgress() {
    const stageOrder = Object.values(CONVERSATION_STAGES);
    const currentIndex = stageOrder.indexOf(this.currentStage);

    const stageMessageCount = this.sessionMetadata.filter(msg =>
      msg.stage === this.currentStage && msg.role === "user"
    ).length;

    // More intelligent progression based on information gathered
    let shouldAdvance = false;

    switch (this.currentStage) {
      case CONVERSATION_STAGES.INTRODUCTION:
        shouldAdvance = this.userProfile.name && stageMessageCount >= 1;
        break;
      case CONVERSATION_STAGES.INTEREST_EXPLORATION:
        shouldAdvance = this.userProfile.interests.length >= 2 || stageMessageCount >= 3;
        break;
      case CONVERSATION_STAGES.SKILLS_ASSESSMENT:
        shouldAdvance = this.userProfile.skills.length >= 2 || stageMessageCount >= 3;
        break;
      default:
        shouldAdvance = stageMessageCount >= 2;
        break;
    }

    if (shouldAdvance && currentIndex < stageOrder.length - 1) {
      if (this.currentStage !== CONVERSATION_STAGES.RECOMMENDATIONS) {
        this.currentStage = stageOrder[currentIndex + 1];
      }
    }
  }

  // 🔹 Add helper methods
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      parts: [{ text: content }]
    });

    this.sessionMetadata.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      stage: this.currentStage
    });
  }

  getProgressPercentage() {
    const stageOrder = Object.values(CONVERSATION_STAGES);
    const currentIndex = stageOrder.indexOf(this.currentStage);
    return Math.round((currentIndex / (stageOrder.length - 1)) * 100);
  }

  getSafeUserProfile() {
    return {
      name: this.userProfile.name,
      age: this.userProfile.age,
      location: this.userProfile.location,
      currentStage: this.currentStage,
      progress: this.getProgressPercentage(),
      interestsExplored: this.userProfile.interests.length,
      skillsIdentified: this.userProfile.skills.length,
      topRiasecCategories: this.getTopRiasecCategories(),
      recentSearches: this.searchResults.slice(-3).map(s => s.query)
    };
  }

  getTopRiasecCategories() {
    return Object.entries(this.userProfile.riasecScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, score]) => ({
        category,
        score,
        description: RIASEC_CATEGORIES[category].description,
        suggestedCareers: RIASEC_CATEGORIES[category].indianCareers.slice(0, 3)
      }));
  }

  // 🔹 Enhanced recommendations with live data
  async generateEnhancedRecommendations() {
    const topCategories = this.getTopRiasecCategories();

    // Search for current market data for top career matches
    const careerSearches = [];
    for (const category of topCategories) {
      for (const career of category.suggestedCareers) {
        careerSearches.push(
          this.executeFunctionCall({
            name: 'search_career_info',
            args: {
              query: `${career} salary job market India 2025`,
              topic: 'general'
            }
          })
        );
      }
    }

    const searchResults = await Promise.all(careerSearches.slice(0, 6)); // Limit to prevent quota issues

    const recommendationPrompt = `
Based on this user's complete profile and current market data, provide 4 specific, data-driven career recommendations:

User Profile: ${JSON.stringify(this.userProfile)}
Current Market Data: ${JSON.stringify(searchResults)}

For each recommendation, provide:
1. Career title
2. Why it matches them personally (reference their specific responses)
3. Current salary range in India (based on search data)
4. Required skills and gap analysis
5. Specific learning path with current course recommendations
6. Current job market status and opportunities
7. 30-60-90 day action plan
8. Success metrics and career growth path

Make it personal, actionable, and grounded in current market reality.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: recommendationPrompt,
      tools: [{ functionDeclarations: TOOL_FUNCTIONS }]
    });

    const result = await model.generateContent(recommendationPrompt);
    return result?.response?.text?.() || "Let me provide you with personalized, research-backed career recommendations!";
  }

  reset() {
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.searchResults = [];
    this.userProfile = {
      name: null,
      age: null,
      location: 'India',
      interests: [],
      skills: [],
      riasecScores: {},
      personalityTraits: {},
      careerGoals: [],
      constraints: [],
      preferredWorkStyle: null,
      salaryExpectations: null
    };
    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.questionsAsked = [];
  }
}

// 🔹 Session management
const activeSessions = new Map();

// 🔹 Enhanced main API function
export async function counselorResponse({
  sessionId = 'default',
  userInput,
  action = 'chat'
}) {
  try {
    if (!activeSessions.has(sessionId)) {
      activeSessions.set(sessionId, new CareerCounselorAI(sessionId));
    }

    const counselor = activeSessions.get(sessionId);

    switch (action) {
      case 'reset':
        counselor.reset();
        return {
          success: true,
          response: "Hello! I'm Eve, your AI career counselor with access to the latest Indian job market data! 🚀 I'm here to help you discover amazing career opportunities that match your interests and have great potential in today's market. What's your name, and what brought you here today?",
          currentStage: CONVERSATION_STAGES.INTRODUCTION,
          progress: 0
        };

      case 'enhanced_recommendations':
        if (counselor.currentStage === CONVERSATION_STAGES.RECOMMENDATIONS) {
          const recommendations = await counselor.generateEnhancedRecommendations();
          return {
            success: true,
            response: recommendations,
            currentStage: counselor.currentStage,
            progress: counselor.getProgressPercentage(),
            userProfile: counselor.getSafeUserProfile(),
            dataSource: 'live_market_data'
          };
        } else {
          return {
            success: false,
            response: "Let's continue our conversation first so I can gather enough information to give you the best recommendations with current market data! 😊"
          };
        }

      case 'market_insights':
        // Get current market insights for their field
        const field = counselor.userProfile.currentField || 'general';
        const insights = await counselor.executeFunctionCall({
          name: 'search_career_info',
          args: {
            query: `${field} career trends job market India 2025`,
            topic: 'news'
          }
        });

        return {
          success: true,
          response: `Here are the latest market insights for ${field} careers in India:\n\n${insights.answer || 'Current market data shows promising opportunities in this field.'}`,
          marketData: insights,
          currentStage: counselor.currentStage
        };

      case 'chat':
      default:
        if (!userInput?.trim()) {
          return {
            success: false,
            response: "I'd love to hear from you! Please share your thoughts so I can provide personalized guidance with current market insights. 😊"
          };
        }

        const result = await counselor.processInput(userInput.trim());
        return {
          success: true,
          ...result,
          enhancedWithLiveData: !!result.searchResults
        };

      case 'status':
        return {
          success: true,
          currentStage: counselor.currentStage,
          progress: counselor.getProgressPercentage(),
          userProfile: counselor.getSafeUserProfile(),
          conversationLength: counselor.conversationHistory.length,
          searchResultsAvailable: counselor.searchResults.length
        };
    }

  } catch (error) {
    console.error("Enhanced counselor error:", error);
    return {
      success: false,
      response: "I'm experiencing some technical difficulties accessing current market data. Let me help you with the information I have available. Please try again in a moment.",
      error: error.message
    };
  }
}

// 🔹 Additional utility functions
export function getSessionInfo(sessionId = 'default') {
  const counselor = activeSessions.get(sessionId);
  if (!counselor) return { exists: false };

  return {
    exists: true,
    currentStage: counselor.currentStage,
    progress: counselor.getProgressPercentage(),
    userProfile: counselor.getSafeUserProfile(),
    conversationLength: counselor.conversationHistory.length,
    searchResults: counselor.searchResults.length,
    lastActivity: counselor.sessionMetadata[counselor.sessionMetadata.length - 1]?.timestamp
  };
}

export function cleanupSessions(maxAge = 24 * 60 * 60 * 1000) {
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

// 🔹 Export search function for direct use if needed
export { searchWeb };
