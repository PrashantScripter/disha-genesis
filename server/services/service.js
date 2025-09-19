import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🔹 Environment validation function
function validateEnvironment() {
  const required = ['GEMINI_API_KEY', 'TAVILY_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
    console.warn('Function calling will be disabled');
  }

  return missing.length === 0;
}

// Check environment on startup
const hasRequiredEnvVars = validateEnvironment();

// 🔹 Enhanced Tavily Search Function with better error handling
async function searchWeb(query, options = {}) {
  try {
    // Check if API key exists
    if (!process.env.TAVILY_API_KEY) {
      console.warn('Tavily API key not found');
      return { results: [], answer: null, error: 'API key not configured' };
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: query,
        search_depth: options.depth || 'basic',
        topic: options.topic || 'general',
        max_results: options.maxResults || 5,
        include_answer: true,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || [],
        ...options
      })
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status} - ${response.statusText}`);
      return { results: [], answer: null, error: `API error: ${response.status}` };
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

// 🔹 Enhanced Career Counselor Class with Fixed Error Handling
class CareerCounselorAI {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.searchResults = [];
    this.userProfile = {
      name: null,
      age: null,
      location: 'India',
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

  // 🔹 Execute function calls with enhanced error handling
  async executeFunctionCall(functionCall) {
    const { name, args } = functionCall;
    console.log('Function call executing:', name, args);

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
          console.warn(`Unknown function: ${name}`);
          return { error: `Unknown function: ${name}` };
      }
    } catch (error) {
      console.error(`Function ${name} error:`, error);
      return { error: error.message };
    }
  }

  // 🔹 Enhanced Response Formatting Method
  formatResponse(response) {
    if (!response) return "";

    return response
      .replace(/\n##/g, '\n\n##')           // Add space before main headings
      .replace(/\n###/g, '\n\n###')         // Add space before subheadings  
      .replace(/---\n/g, '---\n\n')         // Add space after separators
      .replace(/(?<!\n)\n-/g, '\n\n-')      // Add space before bullet lists
      .replace(/(?<!\n)\n\d+\./g, '\n\n1.') // Add space before numbered lists
      .replace(/\n\n\n+/g, '\n\n')          // Remove excessive line breaks
      .trim();
  }

  // 🔹 Format Validation Method
  validateResponseFormat(response) {
    const checks = {
      hasHeading: /##\s/.test(response),
      hasBullets: /-\s/.test(response),
      hasEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(response),
      hasProperSpacing: /\n\n/.test(response),
      hasBoldText: /\*\*.*\*\*/.test(response)
    };

    const score = Object.values(checks).filter(Boolean).length;

    if (score < 3) {
      console.warn("Response may need better formatting. Score:", score, "Checks:", checks);
    }

    return { score, checks };
  }

  // 🔹 Enhanced system prompt with comprehensive formatting instructions
  getSystemPrompt() {
    const basePersonality = `
You are Eve, an advanced AI career counselor specializing in the Indian job market. You have access to real-time web search tools to provide the most current career advice, salary information, and job market trends.

## CRITICAL VISUAL FORMATTING REQUIREMENTS:
You MUST format ALL responses using perfect Markdown structure for excellent visual presentation:

### Response Structure Rules (MANDATORY):
1. **Always start with a main heading** using ## followed by topic and relevant emoji
2. **Use hierarchical structure**: ## for main topics, ### for subsections, #### for sub-points  
3. **Implement proper spacing**: Double line breaks between ALL sections
4. **Strategic emoji placement**: 1-2 emojis in headings, avoid overuse in body text
5. **Bold text strategically**: Maximum 3-4 bold phrases per response for key terms
6. **Bullet points are mandatory**: Never use long paragraph blocks - break into bullets
7. **End with engagement**: Always conclude with a relevant follow-up question

### Visual Template Structure (FOLLOW EXACTLY):
\`\`\`markdown
## [Main Topic Title] [Single Emoji]

### Key Insights:
- **Primary Point**: Specific, actionable information with clear benefit
- **Secondary Point**: Supporting detail with practical application  
- **Third Point**: Next step or resource with timeline

### [Relevant Section Name]:

#### Option 1: [Specific Title]
- **Why It Matters**: Clear explanation of importance
- **Current Status**: Up-to-date information with data
- **Next Steps**: Actionable recommendations

#### Option 2: [Specific Title]  
- **Key Details**: Essential information presented clearly
- **Timeline**: Specific timeframes and milestones
- **Resources**: Concrete tools or platforms mentioned

### Action Items:
1. **Immediate Step**: What to do this week with specific outcome
2. **Short-term Goal**: 30-day objective with measurable result  
3. **Long-term Vision**: 90-day milestone with success criteria

---

### Your Next Move:
[Engaging, specific follow-up question that advances the conversation] 🤔
\`\`\`

Your personality:
- Warm, supportive, and genuinely invested in their success  
- Data-driven but personable - use current market insights to back advice
- Culturally aware of Indian education system and career paths
- Ask thoughtful questions and provide actionable guidance
- Use emojis strategically to feel more human and engaging 😊

IMPORTANT: When you need current information about careers, salaries, job markets, or education options, use the available search functions. Always ground recommendations in fresh, real-world data and present findings in visually appealing format.
`;

    const stageInstructions = {
      [CONVERSATION_STAGES.INTRODUCTION]: `
## Current Stage: Introduction & Getting to Know You 👋

Your goal: Make them comfortable and understand their background using perfect visual structure.

### Required Response Format Example:
\`\`\`
## Welcome to Your Career Journey! 🚀

### About Me:
- I'm Eve, your AI career counselor with access to live Indian job market data
- I specialize in current salary trends, hiring patterns, and growth opportunities  
- I'm here to help you discover your perfect career path using real-time insights

### Let's Get Started:
- What's your name and current location in India?
- What brought you here for career guidance today?
- Are you a student, working professional, or exploring a career change?

### What Makes Me Special:
- **Live Market Data**: Current salary ranges and job availability
- **Personalized Approach**: Tailored advice based on your unique profile  
- **Cultural Awareness**: Deep understanding of Indian education and career paths

---

### I'm excited to help you! What's your name? 😊
\`\`\`
`,

      [CONVERSATION_STAGES.INTEREST_EXPLORATION]: `
## Current Stage: Exploring Interests & Passions 🎯

Your goal: Deeply understand what motivates them using structured, scannable responses.

### Response Requirements:
- Create clear sections for different interest areas
- Use bullet points for various activities and preferences
- Include specific examples and follow-up questions
- Connect interests to potential career paths visually

Use search tools when they mention specific fields to get current market insights.
`,

      [CONVERSATION_STAGES.SKILLS_ASSESSMENT]: `
## Current Stage: Understanding Skills & Strengths 💪

Your goal: Identify their abilities and potential using clear, organized format.

### Response Structure Focus:
- Categorize skills into different types (technical, soft, academic)
- Use bullet points to list and organize abilities
- Connect skills to market demand using search data when relevant
- Highlight transferable skills they might not recognize
`,

      [CONVERSATION_STAGES.PERSONALITY_MAPPING]: `
## Current Stage: Understanding Work Style & Values 🎭

Your goal: Learn how they prefer to work and what drives them.
`,

      [CONVERSATION_STAGES.ACADEMIC_BACKGROUND]: `
## Current Stage: Academic & Professional Background 📚

Your goal: Understand their educational journey and experience.

When they mention their field, search for current career prospects.
`,

      [CONVERSATION_STAGES.CAREER_EXPLORATION]: `
## Current Stage: Career Exploration & Market Reality 🔍

Your goal: Explore career interests while providing current market insights in perfect visual format.

### IMPORTANT: Use search tools for current data and present findings visually.

MUST search for current market data for any careers discussed.
`,

      [CONVERSATION_STAGES.RECOMMENDATIONS]: `
## Current Stage: Data-Driven Career Recommendations 🌟

Your goal: Provide personalized, research-backed career suggestions in excellent visual format.

User Profile: ${JSON.stringify(this.userProfile, null, 2)}
Recent Search Results: ${JSON.stringify(this.searchResults.slice(-3), null, 2)}

### CRITICAL: For each recommendation, search for current data and format properly.

Search for current data on certifications, job opportunities, and salary ranges for each recommendation.
`,

      [CONVERSATION_STAGES.ACTION_PLANNING]: `
## Current Stage: Creating Your Action Plan 📋

Your goal: Help them create concrete, step-by-step plan based on their chosen career path.
`
    };

    return `${basePersonality}

${stageInstructions[this.currentStage]}

Current Context:
- User Profile: ${JSON.stringify(this.userProfile)}
- Stage: ${this.currentStage}
- Previous Questions: ${this.questionsAsked.join(', ')}

Remember: Use the search tools frequently AND format all responses with perfect visual structure using the templates above. Every response should be scannable, engaging, and professionally formatted with proper spacing, headings, bullets, and emojis.
`;
  }

  // 🔹 FIXED: Enhanced process input with improved error handling
  async processInput(userInput) {
    try {
      this.addToHistory("user", userInput);
      this.updateUserProfile(userInput);

      // Try with function calling first
      const modelWithTools = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: this.getSystemPrompt(),
        tools: hasRequiredEnvVars ? [{ functionDeclarations: TOOL_FUNCTIONS }] : undefined
      });

      let result = await modelWithTools.generateContent({
        contents: this.conversationHistory,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1200,
          candidateCount: 1
        }
      });

      let response = result.response;
      let finalResponse = "";

      // Handle function calls if present
      if (response.candidates?.[0]?.content?.parts?.some(part => part.functionCall)) {
        try {
          const functionCalls = response.candidates[0].content.parts.filter(part => part.functionCall);

          for (const part of functionCalls) {
            if (part.functionCall) {
              const searchResult = await this.executeFunctionCall(part.functionCall);

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
          const finalResult = await modelWithTools.generateContent({
            contents: this.conversationHistory,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.9,
              maxOutputTokens: 1200
            }
          });

          finalResponse = this.formatResponse(finalResult?.response?.text?.() || "");
        } catch (functionError) {
          console.error("Function calling failed:", functionError);

          // CRITICAL FIX: Generate response WITHOUT function calling instead of returning static message
          const fallbackModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: this.getSystemPrompt()
            // No tools - forces regular text response
          });

          try {
            const fallbackResult = await fallbackModel.generateContent({
              contents: this.conversationHistory,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 1200
              }
            });

            finalResponse = this.formatResponse(fallbackResult?.response?.text?.() || "");
          } catch (fallbackError) {
            console.error("Fallback generation failed:", fallbackError);
            finalResponse = this.formatResponse("## I'm Here to Help! 😊\n\nI'm experiencing some technical difficulties, but I'm still here to provide career guidance. Let's continue our conversation!\n\n### What I Can Help With:\n- Career exploration and planning\n- Skills assessment and development\n- Educational pathway guidance\n\n---\n\n### What would you like to discuss about your career? 🎯");
          }
        }
      } else {
        // No function calls - regular response
        finalResponse = this.formatResponse(response?.text?.() || "");
      }

      // Validate response formatting
      const formatValidation = this.validateResponseFormat(finalResponse);

      this.addToHistory("model", finalResponse);
      this.checkStageProgress();

      return {
        response: finalResponse,
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        userProfile: this.getSafeUserProfile(),
        formatQuality: formatValidation
      };

    } catch (error) {
      console.error("Career counselor error:", error);

      // Last resort - try basic model without any tools
      try {
        const basicModel = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: "You are Eve, a helpful career counselor. Provide career guidance in a friendly, supportive manner using proper Markdown formatting."
        });

        const basicResult = await basicModel.generateContent(userInput);
        const basicResponse = this.formatResponse(basicResult?.response?.text?.() || "");

        return {
          response: basicResponse,
          currentStage: this.currentStage,
          progress: this.getProgressPercentage(),
          error: true
        };
      } catch (finalError) {
        console.error("All generation methods failed:", finalError);
        // Only now return the static message
        return {
          response: this.formatResponse("## I'm Here to Help! 😊\n\nI apologize, but I'm having trouble accessing current market data right now. Let me help you with the information I have available.\n\n### What I Can Still Do:\n- Provide career guidance based on your interests\n- Help you explore different career paths\n- Discuss your skills and strengths\n\n---\n\n### Let's continue - what would you like to explore about your career? 🎯"),
          currentStage: this.currentStage,
          progress: this.getProgressPercentage(),
          error: true
        };
      }
    }
  }

  // 🔹 Enhanced user profile update (keeping original functionality)
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
        if (inputLower.includes("team") || inputLower.includes("group")) {
          this.userProfile.preferredWorkStyle = "collaborative";
        } else if (inputLower.includes("alone") || inputLower.includes("independent")) {
          this.userProfile.preferredWorkStyle = "independent";
        }

        const salaryMatch = input.match(/(\d+)\s*(?:lakh|k|thousand|crore)/i);
        if (salaryMatch) {
          this.userProfile.salaryExpectations = salaryMatch[0];
        }
        break;

      case CONVERSATION_STAGES.ACADEMIC_BACKGROUND:
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

  // 🔹 Enhanced RIASEC analysis (keeping original functionality)
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

  // 🔹 Enhanced stage progression (keeping original logic)
  checkStageProgress() {
    const stageOrder = Object.values(CONVERSATION_STAGES);
    const currentIndex = stageOrder.indexOf(this.currentStage);

    const stageMessageCount = this.sessionMetadata.filter(msg =>
      msg.stage === this.currentStage && msg.role === "user"
    ).length;

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

  // 🔹 Helper methods (keeping original functionality)
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

  // 🔹 Enhanced recommendations with live data and formatting
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

    const searchResults = await Promise.all(careerSearches.slice(0, 6));

    const recommendationPrompt = `
Based on this user's complete profile and current market data, provide 4 specific, data-driven career recommendations using perfect visual formatting:

User Profile: ${JSON.stringify(this.userProfile)}
Current Market Data: ${JSON.stringify(searchResults)}

CRITICAL: Format the response exactly like the system prompt templates with:
- Clear headings with emojis
- Bullet points for all information
- Proper spacing between sections  
- Bold text for key terms
- Numbered lists for sequential information
- Engaging questions at the end

For each recommendation, provide:
1. Career title with match reasons
2. Current salary ranges (search-based)
3. Required skills and development path
4. Specific learning roadmap with timelines
5. Current job market analysis
6. Actionable next steps

Make it personal, actionable, and visually excellent.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: recommendationPrompt,
      tools: hasRequiredEnvVars ? [{ functionDeclarations: TOOL_FUNCTIONS }] : undefined
    });

    const result = await model.generateContent(recommendationPrompt);
    const response = result?.response?.text?.() || "Let me provide you with personalized, research-backed career recommendations! 🎯";

    return this.formatResponse(response);
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

// 🔹 Enhanced main API function with formatting
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
        const welcomeMessage = `## Welcome to Your Career Journey! 🚀

### About Me:
- I'm Eve, your AI career counselor with access to live Indian job market data
- I specialize in current salary trends, hiring patterns, and growth opportunities  
- I'm here to help you discover your perfect career path using real-time insights

### Let's Get Started:
- What's your name and current location in India?
- What brought you here for career guidance today?
- Are you a student, working professional, or exploring a career change?

### What Makes Me Special:
- **Live Market Data**: Current salary ranges and job availability
- **Personalized Approach**: Tailored advice based on your unique profile  
- **Cultural Awareness**: Deep understanding of Indian education and career paths

---

### I'm excited to help you! What's your name? 😊`;

        return {
          success: true,
          response: counselor.formatResponse(welcomeMessage),
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
            response: counselor.formatResponse(`## Let's Continue Our Journey! 🎯

### Almost There:
- We need to gather more information for the best recommendations
- I want to understand your interests, skills, and goals completely
- This ensures I can provide accurate, current market insights

### Current Progress:
- **Stage**: ${counselor.currentStage}
- **Completion**: ${counselor.getProgressPercentage()}%

---

### What would you like to share next about yourself? 😊`)
          };
        }

      case 'market_insights':
        const field = counselor.userProfile.currentField || 'general';
        const insights = await counselor.executeFunctionCall({
          name: 'search_career_info',
          args: {
            query: `${field} career trends job market India 2025`,
            topic: 'news'
          }
        });

        const marketResponse = `## Market Insights for ${field.charAt(0).toUpperCase() + field.slice(1)} Careers 📊

### Current Trends:
- **Job Market Status**: ${insights.answer || 'Current market shows promising opportunities'}
- **Growth Sectors**: Based on latest industry reports
- **Skill Demands**: What employers are looking for right now

### Key Opportunities:
- **High Demand Roles**: [Based on current hiring patterns]
- **Emerging Areas**: [New specializations gaining traction]
- **Growth Potential**: [Long-term career prospects]

---

### Want to explore specific roles in this field? 🔍`;

        return {
          success: true,
          response: counselor.formatResponse(marketResponse),
          marketData: insights,
          currentStage: counselor.currentStage
        };

      case 'chat':
      default:
        if (!userInput?.trim()) {
          return {
            success: false,
            response: counselor.formatResponse(`## I'm Here to Listen! 👂

### Let's Talk:
- I'd love to hear your thoughts and questions
- Share anything about your career interests or concerns
- Every detail helps me provide better, more personalized guidance

---

### What's on your mind about your career? 😊`)
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
    const errorMessage = `## I'm Here to Help! 🛠️

### Technical Issue:
- I'm experiencing some difficulties accessing current market data
- Don't worry - I can still provide valuable career guidance
- Let me help you with the information I have available

### We Can Still:
- Explore your interests and strengths
- Discuss different career paths
- Plan your next steps

---

### Let's continue - what would you like to explore? 😊`;

    return {
      success: false,
      response: errorMessage,
      error: error.message
    };
  }
}

// 🔹 Additional utility functions (keeping original functionality)
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
