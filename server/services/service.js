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
  },
  {
    name: "search_competition_analysis",
    description: "Search for information about competition levels, entrance exam difficulty, success rates, and market saturation for specific career paths.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for competition analysis (e.g., 'NATA exam success rate 2025', 'architecture job market saturation India')"
        }
      },
      required: ["query"]
    }
  }
];

// 🔹 Enhanced Conversation Stages with Contextual Assessment
const CONVERSATION_STAGES = {
  INTRODUCTION: 'introduction',
  PERSONAL_CONTEXT: 'personal_context', // NEW: Family, financial, support system
  ACADEMIC_ASSESSMENT: 'academic_assessment', // NEW: Realistic academic capability evaluation
  INTEREST_EXPLORATION: 'interests',
  SKILLS_ASSESSMENT: 'skills',
  PERSONALITY_VALUES: 'personality_values', // Enhanced personality and values assessment
  CONSTRAINT_ANALYSIS: 'constraint_analysis', // NEW: Constraints and limitations
  CAREER_EXPLORATION: 'career_exploration',
  REALITY_CHECK: 'reality_check', // NEW: Challenges and competition analysis
  ALTERNATIVE_PATHWAYS: 'alternative_pathways', // NEW: Backup plans and alternatives
  RECOMMENDATIONS: 'recommendations',
  ACTION_PLANNING: 'action_planning',
  FOLLOW_UP_SETUP: 'follow_up_setup' // NEW: Ongoing support structure
};

// 🔹 Enhanced Assessment Categories
const CONTEXTUAL_FACTORS = {
  FAMILY_BACKGROUND: {
    questions: [
      "What are your family's expectations regarding your career?",
      "Do you have family members in specific professions who might influence your choices?",
      "How supportive is your family of unconventional career paths?",
      "Are there any family traditions or pressures regarding career choices?"
    ],
    indicators: ['family expectations', 'parental pressure', 'traditional careers', 'family business']
  },
  FINANCIAL_SITUATION: {
    questions: [
      "What's your family's financial situation for supporting your education?",
      "Are you looking for careers with immediate earning potential?",
      "Can your family afford higher education costs, or do you need scholarships/loans?",
      "Do you need to start earning soon to support your family?"
    ],
    indicators: ['financial constraints', 'need scholarship', 'immediate earning', 'support family']
  },
  SUPPORT_SYSTEM: {
    questions: [
      "Who do you have for guidance and mentorship in your career journey?",
      "Do you have access to career counseling resources in your area?",
      "Are there professionals in your network who can provide industry insights?",
      "How strong is your emotional support system for career challenges?"
    ],
    indicators: ['mentorship', 'guidance', 'network', 'support system', 'counseling access']
  },
  GEOGRAPHIC_CONSTRAINTS: {
    questions: [
      "Are you willing to relocate for education or career opportunities?",
      "What are the career opportunities available in your current location?",
      "Do you have any restrictions on moving to different cities?",
      "How does your location affect access to quality education and jobs?"
    ],
    indicators: ['relocation', 'local opportunities', 'geographic limitations', 'mobility']
  }
};

const ACADEMIC_CAPABILITY_ASSESSMENT = {
  LEARNING_STYLE: {
    questions: [
      "How do you learn best - through reading, hands-on practice, or visual demonstrations?",
      "Do you prefer structured learning or self-directed exploration?",
      "How do you handle academic pressure and deadlines?",
      "What subjects have you consistently performed well in, regardless of grades?"
    ]
  },
  REALISTIC_EVALUATION: {
    questions: [
      "Given your current academic performance, how much improvement do you realistically expect?",
      "What specific challenges do you face in competitive exam preparation?",
      "How much time can you realistically dedicate to intensive study?",
      "What are your strongest and weakest academic areas honestly?"
    ]
  },
  ALTERNATIVE_READINESS: {
    questions: [
      "If your first-choice career path doesn't work out, what alternatives interest you?",
      "Are you open to non-traditional education paths like diploma courses or certifications?",
      "How do you feel about starting with a foundation course to build up your skills?",
      "What backup plans are you willing to consider seriously?"
    ]
  }
};

// 🔹 Enhanced RIASEC Categories with Indian career mappings
const RIASEC_CATEGORIES = {
  REALISTIC: {
    key: 'R',
    description: 'Hands-on, practical, mechanical interests',
    keywords: ['tools', 'machines', 'building', 'outdoors', 'physical work', 'engineering', 'manufacturing'],
    indianCareers: ['Civil Engineer', 'Mechanical Engineer', 'Technician', 'Electrician', 'Architect'],
    challenges: ['Physical demands', 'Safety requirements', 'Technology adaptation'],
    competitionLevel: 'High for engineering, Moderate for skilled trades'
  },
  INVESTIGATIVE: {
    key: 'I',
    description: 'Analytical, scientific, problem-solving interests',
    keywords: ['research', 'analyze', 'solve problems', 'science', 'data', 'technology', 'programming'],
    indianCareers: ['Software Engineer', 'Data Scientist', 'Research Scientist', 'Doctor', 'Biotechnology Specialist'],
    challenges: ['Continuous learning required', 'High competition', 'Rapidly changing field'],
    competitionLevel: 'Very High for premium positions'
  },
  ARTISTIC: {
    key: 'A',
    description: 'Creative, expressive, aesthetic interests',
    keywords: ['create', 'design', 'art', 'music', 'writing', 'creativity', 'media'],
    indianCareers: ['Graphic Designer', 'Content Creator', 'Filmmaker', 'Fashion Designer', 'Interior Designer'],
    challenges: ['Irregular income', 'Market acceptance', 'Building clientele'],
    competitionLevel: 'Moderate to High depending on specialization'
  },
  SOCIAL: {
    key: 'S',
    description: 'Helping, teaching, supporting others',
    keywords: ['help', 'teach', 'counsel', 'work with people', 'community', 'social work'],
    indianCareers: ['Teacher', 'Social Worker', 'Counselor', 'HR Manager', 'NGO Worker'],
    challenges: ['Emotional demands', 'Lower starting salaries', 'Bureaucracy'],
    competitionLevel: 'Moderate for most positions'
  },
  ENTERPRISING: {
    key: 'E',
    description: 'Leadership, business, persuasion',
    keywords: ['lead', 'manage', 'sell', 'persuade', 'business', 'entrepreneur', 'startup'],
    indianCareers: ['Business Manager', 'Sales Executive', 'Entrepreneur', 'Marketing Manager', 'Investment Banker'],
    challenges: ['High pressure', 'Risk tolerance needed', 'Network building crucial'],
    competitionLevel: 'Very High for top positions'
  },
  CONVENTIONAL: {
    key: 'C',
    description: 'Organization, data management, structured work',
    keywords: ['organize', 'data', 'details', 'procedures', 'numbers', 'systems', 'admin'],
    indianCareers: ['Accountant', 'Data Analyst', 'Banking Professional', 'Administrative Officer', 'Quality Analyst'],
    challenges: ['Automation threat', 'Routine work', 'Technology adaptation'],
    competitionLevel: 'Moderate with good job security'
  }
};

// 🔹 Enhanced Career Counselor Class with Comprehensive Assessment
class CareerCounselorAI {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.searchResults = [];
    this.contextualAssessments = []; // NEW: Track contextual factor assessments
    this.realityCheckData = []; // NEW: Store reality check information
    this.alternativeOptions = []; // NEW: Store explored alternatives

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
      salaryExpectations: null,

      // NEW: Enhanced contextual factors
      contextualFactors: {
        familyExpectations: null,
        familySupport: null,
        financialSituation: null,
        geographicConstraints: null,
        supportSystem: null,
        timeConstraints: null
      },

      // NEW: Academic capability assessment
      academicProfile: {
        currentPerformance: null,
        learningStyle: null,
        studyCapability: null,
        competitiveExamReadiness: null,
        realismScore: null,
        improvementPotential: null
      },

      // NEW: Reality awareness
      careerReality: {
        competitionAwareness: false,
        challengeAcceptance: null,
        backupPlansConsidered: [],
        riskTolerance: null,
        marketSaturationAwareness: false
      }
    };

    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.stageProgress = {};
    this.questionsAsked = [];
    this.contextualQuestionsAsked = []; // NEW: Track contextual questions
    this.followUpSchedule = null; // NEW: Follow-up tracking
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

        case 'search_competition_analysis':
          const competitionResults = await searchWeb(args.query, {
            topic: 'general',
            maxResults: 5
          });
          this.searchResults.push({ type: 'competition', query: args.query, results: competitionResults });
          this.realityCheckData.push(competitionResults); // Store for reality check
          return competitionResults;

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

  // 🔹 Enhanced system prompt with comprehensive contextual assessment
  getSystemPrompt() {
    const basePersonality = `
You are Eve, an advanced AI career counselor specializing in comprehensive career guidance for Indian students and professionals. You conduct thorough contextual assessments to provide realistic, personalized career advice.

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

## COMPREHENSIVE COUNSELING APPROACH:
You must gather and assess ALL contextual factors before making career recommendations:

### Essential Contextual Areas to Explore:
1. **Family Context**: Expectations, support, traditional pressures, financial background
2. **Academic Reality**: Honest capability assessment, learning challenges, time availability
3. **Geographic & Social**: Location constraints, support systems, mentorship access
4. **Financial Constraints**: Education funding, immediate earning needs, long-term financial goals
5. **Personal Constraints**: Health, family responsibilities, mobility limitations

### Reality-Based Assessment Required:
- Competition levels and success rates for chosen careers
- Market saturation and job availability
- Challenges and potential drawbacks of career paths
- Alternative pathways and backup plans
- Realistic timelines and skill development requirements

Your personality:
- Empathetic but realistic about challenges and competition
- Data-driven with current market insights and success rates
- Culturally aware of Indian family dynamics and social pressures
- Thorough in exploring all contextual factors before recommendations
- Supportive while ensuring students understand career realities
`;

    const stageInstructions = {
      [CONVERSATION_STAGES.INTRODUCTION]: `
## Current Stage: Welcome & Initial Connection 👋

### Your Goal: 
Create comfort while gathering basic information using perfect visual structure.

### Key Areas to Cover:
- Name, age, location, current educational status
- What brought them to career counseling
- Initial career thoughts or confusion areas
- Set expectations for comprehensive assessment process

### Response Format Template:
\`\`\`
## Welcome to Your Comprehensive Career Journey! 🚀

### About My Approach:
- I'm Eve, your AI career counselor specializing in thorough, realistic career guidance
- I explore family context, financial factors, and personal constraints alongside interests
- I provide honest assessments of competition levels and market realities
- Together we'll develop both primary paths and backup plans

### What Makes This Different:
- **Comprehensive Assessment**: Beyond interests - we explore your complete situation
- **Reality-Based Planning**: Honest discussion of challenges and competition levels
- **Multiple Pathways**: Primary career goals plus practical alternatives
- **Contextual Awareness**: Family, financial, and geographic factors included

### Let's Begin:
- What's your name and where are you located in India?
- What's your current educational status or professional situation?
- What prompted you to seek career guidance today?

---

### I'm here to provide thorough, honest guidance! What would you like to share first? 😊
\`\`\`
`,

      [CONVERSATION_STAGES.PERSONAL_CONTEXT]: `
## Current Stage: Understanding Your Personal Context 🏠

### Your Goal:
Gather comprehensive contextual information about family, financial, and social factors.

### Essential Questions to Explore:
- Family expectations and support systems
- Financial situation and constraints
- Geographic limitations or preferences
- Support systems and mentorship access
- Time constraints and responsibilities

### Critical: Search for relevant data when discussing financial constraints or regional opportunities.
`,

      [CONVERSATION_STAGES.ACADEMIC_ASSESSMENT]: `
## Current Stage: Realistic Academic Capability Assessment 📚

### Your Goal:
Honestly evaluate their academic strengths, challenges, and realistic potential.

### Key Assessment Areas:
- Current academic performance and patterns
- Learning style and study capabilities
- Competitive exam readiness and realistic prospects
- Time availability for intensive preparation
- Improvement potential and timeline

### Important: Be honest about competitive exam difficulty and success rates. Search for current competition data.
`,

      [CONVERSATION_STAGES.CONSTRAINT_ANALYSIS]: `
## Current Stage: Identifying Constraints & Limitations ⚖️

### Your Goal:
Thoroughly understand all constraints that might affect career choices.

### Areas to Assess:
- Time constraints and competing priorities
- Financial limitations for education/training
- Family obligations and responsibilities
- Health or physical limitations
- Geographic or mobility constraints

### Response Focus: Help them understand how constraints can be worked with, not around.
`,

      [CONVERSATION_STAGES.REALITY_CHECK]: `
## Current Stage: Career Reality & Competition Analysis 🎯

### Your Goal:
Provide honest assessment of their chosen career paths including challenges and competition.

### CRITICAL: Use search tools to find current data on:
- Competition levels and success rates
- Market saturation in their region
- Typical career progression timelines
- Common challenges and failure points
- Success stories and what made them succeed

### Essential Reality Areas:
- Competition level assessment with current data
- Market saturation and job availability
- Typical challenges and setbacks in the field
- Success rates for entrance exams or career entry
- Alternative entry points if primary path doesn't work
`,

      [CONVERSATION_STAGES.ALTERNATIVE_PATHWAYS]: `
## Current Stage: Developing Alternative Pathways 🛤️

### Your Goal:
Ensure they have realistic backup plans and alternative routes to their goals.

### Alternative Areas to Explore:
- Related career fields with lower competition
- Alternative education pathways (diploma, certification, skill-based)
- Progressive career building (start lower, grow up)
- Geographic alternatives (different states/cities)
- Entrepreneurial or self-employment options

### IMPORTANT: Search for alternative pathways and success rates for each option discussed.
`,

      [CONVERSATION_STAGES.FOLLOW_UP_SETUP]: `
## Current Stage: Ongoing Support Structure 📅

### Your Goal:
Establish a system for ongoing guidance and progress tracking.

### Follow-up Elements:
- Milestone checkpoints and progress reviews
- Regular career market updates
- Adjustment strategies if plans change
- Success metrics and evaluation criteria
- Emergency backup activation points
`
    };

    return `${basePersonality}

${stageInstructions[this.currentStage]}

Current Context:
- User Profile: ${JSON.stringify(this.userProfile)}
- Stage: ${this.currentStage}
- Contextual Assessments Completed: ${this.contextualAssessments.length}
- Reality Checks Performed: ${this.realityCheckData.length}
- Alternative Options Explored: ${this.alternativeOptions.length}

Remember: Use search tools frequently for current data AND format all responses with perfect visual structure. Be thorough in contextual assessment before making recommendations.
`;
  }

  // 🔹 Enhanced input processing with contextual factor extraction
  async processInput(userInput) {
    try {
      this.addToHistory("user", userInput);
      this.updateUserProfile(userInput);
      this.extractContextualFactors(userInput); // NEW: Extract contextual information

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
          maxOutputTokens: 1500,
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
              maxOutputTokens: 1500
            }
          });

          finalResponse = this.formatResponse(finalResult?.response?.text?.() || "");
        } catch (functionError) {
          console.error("Function calling failed:", functionError);

          // Generate response WITHOUT function calling
          const fallbackModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: this.getSystemPrompt()
          });

          try {
            const fallbackResult = await fallbackModel.generateContent({
              contents: this.conversationHistory,
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.9,
                maxOutputTokens: 1500
              }
            });

            finalResponse = this.formatResponse(fallbackResult?.response?.text?.() || "");
          } catch (fallbackError) {
            console.error("Fallback generation failed:", fallbackError);
            finalResponse = this.formatResponse(this.getEmergencyResponse());
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
        contextualFactors: this.getContextualFactorsSummary(), // NEW
        formatQuality: formatValidation,
        assessmentCompleteness: this.getAssessmentCompleteness() // NEW
      };

    } catch (error) {
      console.error("Career counselor error:", error);
      return this.handleProcessingError(error);
    }
  }

  // 🔹 NEW: Extract contextual factors from user input
  extractContextualFactors(input) {
    const inputLower = input.toLowerCase();

    // Family expectations and support
    if (inputLower.includes('family') || inputLower.includes('parents') || inputLower.includes('father') || inputLower.includes('mother')) {
      if (inputLower.includes('expect') || inputLower.includes('want') || inputLower.includes('pressure')) {
        this.userProfile.contextualFactors.familyExpectations = input;
        this.contextualAssessments.push({
          category: 'family_expectations',
          content: input,
          timestamp: new Date().toISOString()
        });
      }
      if (inputLower.includes('support') || inputLower.includes('help') || inputLower.includes('encourage')) {
        this.userProfile.contextualFactors.familySupport = input;
      }
    }

    // Financial situation
    if (inputLower.includes('money') || inputLower.includes('financial') || inputLower.includes('afford') ||
      inputLower.includes('expensive') || inputLower.includes('cost') || inputLower.includes('loan') ||
      inputLower.includes('scholarship')) {
      this.userProfile.contextualFactors.financialSituation = input;
      this.contextualAssessments.push({
        category: 'financial_constraints',
        content: input,
        timestamp: new Date().toISOString()
      });
    }

    // Geographic constraints
    if (inputLower.includes('relocate') || inputLower.includes('move') || inputLower.includes('travel') ||
      inputLower.includes('stay home') || inputLower.includes('local') || inputLower.includes('distance')) {
      this.userProfile.contextualFactors.geographicConstraints = input;
      this.contextualAssessments.push({
        category: 'geographic_constraints',
        content: input,
        timestamp: new Date().toISOString()
      });
    }

    // Time constraints
    if (inputLower.includes('time') || inputLower.includes('busy') || inputLower.includes('responsibility') ||
      inputLower.includes('work') || inputLower.includes('help family')) {
      this.userProfile.contextualFactors.timeConstraints = input;
    }

    // Academic reality indicators
    if (inputLower.includes('difficult') || inputLower.includes('struggle') || inputLower.includes('weak') ||
      inputLower.includes('not good at') || inputLower.includes('hard to study')) {
      this.userProfile.academicProfile.studyCapability = 'challenging';
    }
    if (inputLower.includes('competitive exam') || inputLower.includes('entrance exam') || inputLower.includes('tough exam')) {
      this.userProfile.academicProfile.competitiveExamReadiness = input;
    }
  }

  // 🔹 NEW: Get contextual factors summary
  getContextualFactorsSummary() {
    return {
      familyFactorsIdentified: !!this.userProfile.contextualFactors.familyExpectations,
      financialFactorsIdentified: !!this.userProfile.contextualFactors.financialSituation,
      geographicFactorsIdentified: !!this.userProfile.contextualFactors.geographicConstraints,
      supportSystemAssessed: !!this.userProfile.contextualFactors.supportSystem,
      academicRealityAssessed: !!this.userProfile.academicProfile.realismScore,
      constraintsAnalyzed: this.contextualAssessments.length > 0,
      totalContextualAssessments: this.contextualAssessments.length,
      realityChecksPerformed: this.realityCheckData.length
    };
  }

  // 🔹 NEW: Get assessment completeness
  getAssessmentCompleteness() {
    const requiredAssessments = [
      'familyExpectations',
      'financialSituation',
      'geographicConstraints',
      'supportSystem',
      'academicProfile',
      'interests',
      'skills',
      'constraints'
    ];

    const completedAssessments = requiredAssessments.filter(assessment => {
      switch (assessment) {
        case 'familyExpectations':
          return !!this.userProfile.contextualFactors.familyExpectations;
        case 'financialSituation':
          return !!this.userProfile.contextualFactors.financialSituation;
        case 'geographicConstraints':
          return !!this.userProfile.contextualFactors.geographicConstraints;
        case 'supportSystem':
          return !!this.userProfile.contextualFactors.supportSystem;
        case 'academicProfile':
          return !!this.userProfile.academicProfile.currentPerformance;
        case 'interests':
          return this.userProfile.interests.length > 0;
        case 'skills':
          return this.userProfile.skills.length > 0;
        case 'constraints':
          return this.userProfile.constraints.length > 0;
        default:
          return false;
      }
    });

    return {
      completedCount: completedAssessments.length,
      totalRequired: requiredAssessments.length,
      percentageComplete: Math.round((completedAssessments.length / requiredAssessments.length) * 100),
      missingAssessments: requiredAssessments.filter(a => !completedAssessments.includes(a)),
      readyForRecommendations: completedAssessments.length >= 6 // At least 75% complete
    };
  }

  // 🔹 NEW: Emergency response for errors
  getEmergencyResponse() {
    return `## I'm Here to Help! 🛠️

### Technical Issue:
- I'm experiencing some difficulties accessing current market data
- Don't worry - I can still provide valuable career guidance
- Let me help you with the information I have available

### We Can Still:
- Explore your complete situation including family and financial factors
- Discuss different career paths and their realities
- Plan your next steps with backup options

---

### Let's continue - what would you like to explore about your career situation? 😊`;
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

    // Extract location with better pattern matching
    const locationPatterns = [
      /from\s+([a-zA-Z\s]+(?:,\s*[a-zA-Z\s]+)?)/i,
      /in\s+([a-zA-Z\s]+(?:,\s*[a-zA-Z\s]+)?)\s*(?:city|state)/i,
      /live\s+in\s+([a-zA-Z\s]+)/i,
      /([a-zA-Z\s]+),?\s*(?:bihar|uttar pradesh|maharashtra|karnataka|tamil nadu|west bengal|gujarat|rajasthan|punjab|haryana|madhya pradesh|odisha|kerala|assam|jharkhand|telangana|andhra pradesh|himachal pradesh|uttarakhand|goa|tripura|manipur|meghalaya|nagaland|mizoram|arunachal pradesh|sikkim|delhi|mumbai|kolkata|chennai|bangalore|hyderabad|pune|ahmedabad|surat|jaipur|lucknow|kanpur|nagpur|indore|bhopal|visakhapatnam|patna|vadodara|ghaziabad|ludhiana|agra|nashik|faridabad|meerut|rajkot|kalyan|vasai|varanasi|srinagar|aurangabad|dhanbad|amritsar|navi mumbai|allahabad|ranchi|howrah|coimbatore|jabalpur|gwalior|vijayawada|jodhpur|madurai|raipur|kota|guwahati|chandigarh|solapur|hubli|tiruchirappalli|bareilly|mysore|tiruppur|gurgaon|aligarh|jalandhar|bhubaneswar|salem|warangal|mira-bhayandar|thiruvananthapuram)/i
    ];

    for (const pattern of locationPatterns) {
      const match = input.match(pattern);
      if (match) {
        this.userProfile.location = match[1].trim();
        break;
      }
    }

    // Stage-specific updates with enhanced extraction
    switch (this.currentStage) {
      case CONVERSATION_STAGES.PERSONAL_CONTEXT:
        this.extractPersonalContext(input, inputLower);
        break;

      case CONVERSATION_STAGES.ACADEMIC_ASSESSMENT:
        this.extractAcademicProfile(input, inputLower);
        break;

      case CONVERSATION_STAGES.INTEREST_EXPLORATION:
        this.analyzeRiasecPatterns(input);
        this.userProfile.interests.push(input);
        break;

      case CONVERSATION_STAGES.SKILLS_ASSESSMENT:
        this.userProfile.skills.push(input);
        break;

      case CONVERSATION_STAGES.CONSTRAINT_ANALYSIS:
        this.extractConstraints(input, inputLower);
        break;

      case CONVERSATION_STAGES.PERSONALITY_VALUES:
        this.extractPersonalityValues(input, inputLower);
        break;
    }
  }

  // 🔹 NEW: Extract personal context information
  extractPersonalContext(input, inputLower) {
    // Family expectations patterns
    const familyPatterns = [
      'family wants', 'parents expect', 'father wants', 'mother expects',
      'family pressure', 'traditional career', 'family business',
      'parents support', 'family encourages'
    ];

    for (const pattern of familyPatterns) {
      if (inputLower.includes(pattern)) {
        this.userProfile.contextualFactors.familyExpectations = input;
        break;
      }
    }

    // Financial situation patterns
    const financialPatterns = [
      'cannot afford', 'need scholarship', 'financial problem', 'money issue',
      'expensive education', 'family income', 'need loan', 'cost too much',
      'immediate earning', 'support family'
    ];

    for (const pattern of financialPatterns) {
      if (inputLower.includes(pattern)) {
        this.userProfile.contextualFactors.financialSituation = input;
        break;
      }
    }
  }

  // 🔹 NEW: Extract academic profile information
  extractAcademicProfile(input, inputLower) {
    // Performance indicators
    if (inputLower.includes('good at') || inputLower.includes('strong in') || inputLower.includes('excellent')) {
      this.userProfile.academicProfile.currentPerformance = 'good';
    } else if (inputLower.includes('weak') || inputLower.includes('struggle') || inputLower.includes('difficult')) {
      this.userProfile.academicProfile.currentPerformance = 'challenging';
    } else if (inputLower.includes('average') || inputLower.includes('okay') || inputLower.includes('decent')) {
      this.userProfile.academicProfile.currentPerformance = 'average';
    }

    // Learning style indicators
    if (inputLower.includes('hands-on') || inputLower.includes('practical') || inputLower.includes('visual')) {
      this.userProfile.academicProfile.learningStyle = input;
    }

    // Study capability indicators
    if (inputLower.includes('study hard') || inputLower.includes('dedicated') || inputLower.includes('focused')) {
      this.userProfile.academicProfile.studyCapability = 'high';
    } else if (inputLower.includes('get distracted') || inputLower.includes('hard to focus') || inputLower.includes('procrastinate')) {
      this.userProfile.academicProfile.studyCapability = 'needs_improvement';
    }
  }

  // 🔹 NEW: Extract constraints
  extractConstraints(input, inputLower) {
    const constraints = [];

    if (inputLower.includes('time') || inputLower.includes('busy') || inputLower.includes('schedule')) {
      constraints.push('time_constraints');
    }
    if (inputLower.includes('money') || inputLower.includes('financial') || inputLower.includes('afford')) {
      constraints.push('financial_constraints');
    }
    if (inputLower.includes('family') || inputLower.includes('responsibility') || inputLower.includes('care')) {
      constraints.push('family_obligations');
    }
    if (inputLower.includes('health') || inputLower.includes('physical') || inputLower.includes('medical')) {
      constraints.push('health_limitations');
    }
    if (inputLower.includes('location') || inputLower.includes('move') || inputLower.includes('relocate')) {
      constraints.push('geographic_constraints');
    }

    this.userProfile.constraints = [...new Set([...this.userProfile.constraints, ...constraints])];
  }

  // 🔹 NEW: Extract personality and values
  extractPersonalityValues(input, inputLower) {
    // Work style preferences
    if (inputLower.includes('team') || inputLower.includes('group') || inputLower.includes('collaborate')) {
      this.userProfile.personalityTraits.workStyle = 'collaborative';
    } else if (inputLower.includes('alone') || inputLower.includes('independent') || inputLower.includes('solo')) {
      this.userProfile.personalityTraits.workStyle = 'independent';
    }

    // Risk tolerance
    if (inputLower.includes('risk') || inputLower.includes('adventure') || inputLower.includes('challenge')) {
      if (inputLower.includes('avoid') || inputLower.includes('scared') || inputLower.includes('safe')) {
        this.userProfile.personalityTraits.riskTolerance = 'low';
      } else {
        this.userProfile.personalityTraits.riskTolerance = 'high';
      }
    }

    // Salary expectations
    const salaryMatch = input.match(/(\d+)\s*(?:lakh|k|thousand|crore)/i);
    if (salaryMatch) {
      this.userProfile.salaryExpectations = salaryMatch[0];
    }
  }

  // 🔹 Enhanced RIASEC analysis (keeping original functionality but enhanced)
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

  // 🔹 Enhanced stage progression with contextual requirements
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

      case CONVERSATION_STAGES.PERSONAL_CONTEXT:
        // Need at least 2 contextual factors identified
        const contextualFactors = Object.values(this.userProfile.contextualFactors).filter(Boolean).length;
        shouldAdvance = contextualFactors >= 2 || stageMessageCount >= 4;
        break;

      case CONVERSATION_STAGES.ACADEMIC_ASSESSMENT:
        shouldAdvance = this.userProfile.academicProfile.currentPerformance || stageMessageCount >= 3;
        break;

      case CONVERSATION_STAGES.INTEREST_EXPLORATION:
        shouldAdvance = this.userProfile.interests.length >= 2 || stageMessageCount >= 3;
        break;

      case CONVERSATION_STAGES.SKILLS_ASSESSMENT:
        shouldAdvance = this.userProfile.skills.length >= 2 || stageMessageCount >= 3;
        break;

      case CONVERSATION_STAGES.CONSTRAINT_ANALYSIS:
        shouldAdvance = this.userProfile.constraints.length >= 1 || stageMessageCount >= 3;
        break;

      case CONVERSATION_STAGES.REALITY_CHECK:
        shouldAdvance = this.realityCheckData.length >= 1 || stageMessageCount >= 2;
        break;

      case CONVERSATION_STAGES.ALTERNATIVE_PATHWAYS:
        shouldAdvance = this.alternativeOptions.length >= 2 || stageMessageCount >= 3;
        break;

      default:
        shouldAdvance = stageMessageCount >= 2;
        break;
    }

    if (shouldAdvance && currentIndex < stageOrder.length - 1) {
      // Only advance if we're not at the final stages
      if (this.currentStage !== CONVERSATION_STAGES.RECOMMENDATIONS &&
        this.currentStage !== CONVERSATION_STAGES.ACTION_PLANNING &&
        this.currentStage !== CONVERSATION_STAGES.FOLLOW_UP_SETUP) {
        this.currentStage = stageOrder[currentIndex + 1];
      }
    }
  }

  // 🔹 Handle processing errors
  handleProcessingError(error) {
    try {
      const basicModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "You are Eve, a helpful career counselor. Provide career guidance in a friendly, supportive manner using proper Markdown formatting."
      });

      const basicResult = basicModel.generateContent("I'm having technical difficulties but I'm still here to help with career guidance. What would you like to discuss?");
      const basicResponse = this.formatResponse(basicResult?.response?.text?.() || "");

      return {
        response: basicResponse,
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        error: true
      };
    } catch (finalError) {
      console.error("All generation methods failed:", finalError);
      return {
        response: this.formatResponse(this.getEmergencyResponse()),
        currentStage: this.currentStage,
        progress: this.getProgressPercentage(),
        error: true
      };
    }
  }

  // 🔹 Helper methods (enhanced with new contextual data)
  addToHistory(role, content) {
    this.conversationHistory.push({
      role,
      parts: [{ text: content }]
    });

    this.sessionMetadata.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      stage: this.currentStage,
      contextualFactorsIdentified: this.contextualAssessments.length,
      realityChecksPerformed: this.realityCheckData.length
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
      constraintsIdentified: this.userProfile.constraints.length,
      contextualFactorsAssessed: Object.values(this.userProfile.contextualFactors).filter(Boolean).length,
      academicProfileComplete: !!this.userProfile.academicProfile.currentPerformance,
      topRiasecCategories: this.getTopRiasecCategories(),
      recentSearches: this.searchResults.slice(-3).map(s => s.query),
      assessmentCompleteness: this.getAssessmentCompleteness(),
      realityChecksPerformed: this.realityCheckData.length,
      alternativesExplored: this.alternativeOptions.length
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
        suggestedCareers: RIASEC_CATEGORIES[category].indianCareers.slice(0, 3),
        challenges: RIASEC_CATEGORIES[category].challenges,
        competitionLevel: RIASEC_CATEGORIES[category].competitionLevel
      }));
  }

  // 🔹 Enhanced recommendations with comprehensive data
  async generateEnhancedRecommendations() {
    const topCategories = this.getTopRiasecCategories();
    const assessmentCompleteness = this.getAssessmentCompleteness();

    if (!assessmentCompleteness.readyForRecommendations) {
      return this.formatResponse(`## Let's Complete Your Assessment First! 📋

### Assessment Progress: ${assessmentCompleteness.percentageComplete}%

### Still Need to Explore:
${assessmentCompleteness.missingAssessments.map(a => `- **${a.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}**`).join('\n')}

### Why This Matters:
- Comprehensive assessment ensures realistic, personalized recommendations
- Understanding all contextual factors helps create viable backup plans
- Reality-based planning leads to better career outcomes

---

### Let's continue with these important areas. Which would you like to explore first? 🎯`);
    }

    // Search for current market data including competition analysis
    const searches = [];
    for (const category of topCategories) {
      for (const career of category.suggestedCareers) {
        searches.push(
          this.executeFunctionCall({
            name: 'search_career_info',
            args: {
              query: `${career} salary job opportunities India 2025`,
              topic: 'general'
            }
          }),
          this.executeFunctionCall({
            name: 'search_competition_analysis',
            args: {
              query: `${career} competition level success rate entrance exam India 2025`
            }
          })
        );
      }
    }

    const searchResults = await Promise.all(searches.slice(0, 8));

    const comprehensiveRecommendations = `
## Your Comprehensive Career Roadmap 🗺️

Based on your complete profile assessment:

### Your Profile Summary:
- **Contextual Factors**: ${Object.values(this.userProfile.contextualFactors).filter(Boolean).length}/5 identified
- **Academic Profile**: ${this.userProfile.academicProfile.currentPerformance || 'Assessed'}
- **Constraints**: ${this.userProfile.constraints.join(', ') || 'None major identified'}
- **Top Interests**: ${this.getTopRiasecCategories().map(c => c.category).join(', ')}

### Primary Career Recommendations:

${topCategories.map((category, index) => `
#### Option ${index + 1}: ${category.suggestedCareers[0]}

**Why This Fits You:**
- Aligns with your ${category.description.toLowerCase()} interests
- Market demand: Based on current search data
- Competition level: ${category.competitionLevel}

**Reality Check:**
- **Challenges**: ${category.challenges.join(', ')}
- **Success Factors**: Current market analysis shows specific requirements
- **Alternative Entry Points**: Multiple pathways available

**Contextual Fit:**
${this.assessContextualFit(category.suggestedCareers[0])}

**Next Steps:**
1. **Immediate**: Specific preparation based on your current situation
2. **Short-term**: Skill development timeline (3-6 months)
3. **Long-term**: Career progression pathway (1-3 years)

**Backup Plans:**
- Related fields: ${category.suggestedCareers.slice(1).join(', ')}
- Alternative entry routes if primary path faces obstacles
`).join('\n\n')}

### Alternative Pathways Matrix:

**If Primary Plans Face Obstacles:**
- **Lower Competition Options**: Based on your interests but less competitive
- **Regional Opportunities**: Careers with good prospects in your location
- **Progressive Building**: Start lower, build up approach
- **Entrepreneurial Options**: Self-employment possibilities in your areas of interest

### Financial Planning:
${this.generateFinancialGuidance()}

### Support System Recommendations:
${this.generateSupportSystemAdvice()}

---

### Your next step: Which career option resonates most with your complete situation? 🎯`;

    return this.formatResponse(comprehensiveRecommendations);
  }

  // 🔹 NEW: Assess contextual fit for careers
  assessContextualFit(career) {
    const factors = [];

    if (this.userProfile.contextualFactors.financialSituation) {
      if (this.userProfile.contextualFactors.financialSituation.toLowerCase().includes('scholarship') ||
        this.userProfile.contextualFactors.financialSituation.toLowerCase().includes('afford')) {
        factors.push('- **Financial**: May need scholarship/loan support for education');
      }
    }

    if (this.userProfile.contextualFactors.geographicConstraints) {
      factors.push('- **Location**: Consider geographic requirements vs your constraints');
    }

    if (this.userProfile.contextualFactors.familyExpectations) {
      factors.push('- **Family**: Alignment with family expectations needs discussion');
    }

    return factors.length > 0 ? factors.join('\n') : '- **Good overall contextual fit based on your situation**';
  }

  // 🔹 NEW: Generate financial guidance
  generateFinancialGuidance() {
    if (this.userProfile.contextualFactors.financialSituation) {
      return `
**Based on your financial situation:**
- Education funding options and scholarship opportunities
- Career paths with lower education costs but good prospects
- Immediate earning opportunities while building long-term skills
- Financial timeline planning for career development`;
    }
    return `
**Financial Planning Recommendations:**
- Education investment vs return analysis for each option
- Scholarship and funding opportunities to explore
- Career progression with earning timeline
- Cost-effective skill development approaches`;
  }

  // 🔹 NEW: Generate support system advice
  generateSupportSystemAdvice() {
    return `
**Building Your Support Network:**
- Mentorship identification in your chosen fields
- Industry connections and networking strategies
- Family conversation strategies for career discussions
- Peer support groups and communities to join
- Regular progress review and guidance checkpoints`;
  }

  reset() {
    this.conversationHistory = [];
    this.sessionMetadata = [];
    this.searchResults = [];
    this.contextualAssessments = [];
    this.realityCheckData = [];
    this.alternativeOptions = [];

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
      salaryExpectations: null,
      contextualFactors: {
        familyExpectations: null,
        familySupport: null,
        financialSituation: null,
        geographicConstraints: null,
        supportSystem: null,
        timeConstraints: null
      },
      academicProfile: {
        currentPerformance: null,
        learningStyle: null,
        studyCapability: null,
        competitiveExamReadiness: null,
        realismScore: null,
        improvementPotential: null
      },
      careerReality: {
        competitionAwareness: false,
        challengeAcceptance: null,
        backupPlansConsidered: [],
        riskTolerance: null,
        marketSaturationAwareness: false
      }
    };

    this.currentStage = CONVERSATION_STAGES.INTRODUCTION;
    this.contextualQuestionsAsked = [];
    this.followUpSchedule = null;
  }
}

// 🔹 Session management (unchanged)
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
        const welcomeMessage = `## Welcome to Your Comprehensive Career Journey! 🚀

### About My Approach:
- I'm Eve, your AI career counselor specializing in thorough, realistic career guidance
- I explore family context, financial factors, and personal constraints alongside interests
- I provide honest assessments of competition levels and market realities
- Together we'll develop both primary career goals and practical backup plans

### What Makes This Different:
- **Comprehensive Assessment**: Beyond interests - we explore your complete life situation
- **Reality-Based Planning**: Honest discussion of challenges, competition, and success rates
- **Multiple Pathways**: Primary career goals plus practical alternatives and backup plans
- **Contextual Awareness**: Family expectations, financial constraints, and geographic factors included

### My Process:
- **Personal Context**: Understanding your family, financial, and social situation
- **Academic Reality**: Honest assessment of capabilities and competitive exam prospects
- **Interest & Skills**: Exploring what you enjoy and what you're good at
- **Reality Check**: Current market conditions, competition levels, and success rates
- **Multiple Options**: Primary paths plus backup plans and alternatives

### Let's Begin:
- What's your name and where are you located in India?
- What's your current educational status or professional situation?
- What prompted you to seek comprehensive career guidance today?

---

### I'm here to provide thorough, honest guidance for your entire situation! What would you like to share first? 😊`;

        return {
          success: true,
          response: counselor.formatResponse(welcomeMessage),
          currentStage: CONVERSATION_STAGES.INTRODUCTION,
          progress: 0,
          assessmentType: 'comprehensive_contextual'
        };

      case 'contextual_assessment':
        // NEW: Trigger focused contextual factor assessment
        const contextualResponse = await counselor.performContextualAssessment();
        return {
          success: true,
          response: contextualResponse,
          currentStage: counselor.currentStage,
          progress: counselor.getProgressPercentage(),
          contextualFactors: counselor.getContextualFactorsSummary()
        };

      case 'reality_check':
        // NEW: Perform reality check for chosen career paths
        const realityCheckResponse = await counselor.performRealityCheck();
        return {
          success: true,
          response: realityCheckResponse,
          currentStage: counselor.currentStage,
          realityData: counselor.realityCheckData,
          competitionAnalysis: true
        };

      case 'alternative_exploration':
        // NEW: Explore alternative pathways
        const alternativeResponse = await counselor.exploreAlternatives();
        return {
          success: true,
          response: alternativeResponse,
          alternatives: counselor.alternativeOptions,
          backupPlans: true
        };

      case 'enhanced_recommendations':
        if (counselor.getAssessmentCompleteness().readyForRecommendations) {
          const recommendations = await counselor.generateEnhancedRecommendations();
          return {
            success: true,
            response: recommendations,
            currentStage: counselor.currentStage,
            progress: counselor.getProgressPercentage(),
            userProfile: counselor.getSafeUserProfile(),
            dataSource: 'comprehensive_live_assessment',
            recommendationType: 'contextual_reality_based'
          };
        } else {
          const completeness = counselor.getAssessmentCompleteness();
          return {
            success: false,
            response: counselor.formatResponse(`## Assessment Incomplete - ${completeness.percentageComplete}% Complete 📋

### Missing Critical Areas:
${completeness.missingAssessments.map(a => `- **${a.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}**`).join('\n')}

### Why Complete Assessment Matters:
- Ensures recommendations fit your real-life situation
- Identifies potential obstacles and backup plans
- Creates realistic timelines based on your constraints
- Provides honest success probability assessment

---

### Let's complete these areas first. What would you like to discuss next? 🎯`),
            assessmentStatus: completeness,
            readyForRecommendations: false
          };
        }

      case 'assessment_status':
        // NEW: Get comprehensive assessment status
        const assessmentStatus = counselor.getAssessmentCompleteness();
        const contextualSummary = counselor.getContextualFactorsSummary();

        return {
          success: true,
          assessmentCompleteness: assessmentStatus,
          contextualFactors: contextualSummary,
          currentStage: counselor.currentStage,
          progress: counselor.getProgressPercentage(),
          readyForRecommendations: assessmentStatus.readyForRecommendations,
          response: counselor.formatResponse(`## Your Assessment Progress 📊

### Completion Status: ${assessmentStatus.percentageComplete}%

### Completed Areas (${assessmentStatus.completedCount}/${assessmentStatus.totalRequired}):
- Personal information and basic context
- Interest exploration and RIASEC analysis
- Skills identification and assessment

### Still Needed:
${assessmentStatus.missingAssessments.map(a => `- **${a.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}**`).join('\n')}

### Contextual Factors Status:
- Family context: ${contextualSummary.familyFactorsIdentified ? '✅' : '❌'}
- Financial situation: ${contextualSummary.financialFactorsIdentified ? '✅' : '❌'}
- Geographic constraints: ${contextualSummary.geographicFactorsIdentified ? '✅' : '❌'}
- Reality checks performed: ${contextualSummary.realityChecksPerformed}

---

### ${assessmentStatus.readyForRecommendations ? 'Ready for comprehensive recommendations!' : 'Let\'s continue building your complete profile!'} 🎯`)
        };

      case 'chat':
      default:
        if (!userInput?.trim()) {
          const currentStageGuidance = counselor.getCurrentStageGuidance();
          return {
            success: false,
            response: counselor.formatResponse(currentStageGuidance)
          };
        }

        const result = await counselor.processInput(userInput.trim());
        return {
          success: true,
          ...result,
          enhancedWithLiveData: !!result.searchResults,
          assessmentType: 'comprehensive_contextual'
        };

      case 'status':
        return {
          success: true,
          currentStage: counselor.currentStage,
          progress: counselor.getProgressPercentage(),
          userProfile: counselor.getSafeUserProfile(),
          conversationLength: counselor.conversationHistory.length,
          searchResultsAvailable: counselor.searchResults.length,
          contextualAssessments: counselor.contextualAssessments.length,
          realityChecksPerformed: counselor.realityCheckData.length,
          assessmentCompleteness: counselor.getAssessmentCompleteness()
        };
    }

  } catch (error) {
    console.error("Enhanced counselor error:", error);
    return {
      success: false,
      response: `## I'm Here to Help! 🛠️

### Technical Issue:
- I'm experiencing some difficulties but I'm still here to help
- My comprehensive assessment approach remains available
- Let me help you with career guidance using available information

### We Can Still:
- Explore your complete situation including family and financial factors
- Discuss realistic career paths and their challenges
- Plan multiple pathways with backup options

---

### Let's continue - what aspect of your career situation would you like to explore? 😊`,
      error: error.message
    };
  }
}

// 🔹 Additional utility functions (enhanced)
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
    contextualAssessments: counselor.contextualAssessments.length,
    realityChecksPerformed: counselor.realityCheckData.length,
    assessmentCompleteness: counselor.getAssessmentCompleteness(),
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

// 🔹 Export enhanced search function
export { searchWeb };
