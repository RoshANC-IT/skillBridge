import { GoogleGenerativeAI } from "@google/generative-ai";

export const handleChatMessage = async (req, res) => {
  try {
    const { message, history, role } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured. Using local fallback bot.");
      return handleLocalFallback(message, role, res);
    }

    // Initialize the SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the recommended model for text
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construct the system instruction context
    let systemPrompt = `You are the official support assistant for 'Skill Bridge', a platform connecting homeowners/employers with skilled workers (Home Services like Cleaning, Plumbing, Electrical, and Construction workers like Masons, Welders, Carpenters). 
    Your goal is to be helpful, concise, and polite. Keep answers relatively short. Use emojis occasionally. `;

    if (role === "employer") {
      systemPrompt += `You are talking to an Employer. Employers can post jobs, browse workers, view worker reliability scores, and book teams. `;
    } else if (role === "worker") {
      systemPrompt += `You are talking to a Worker. Workers can view jobs, apply for jobs, track their earnings, and maintain a reliability score based on punctuality and acceptance rates. `;
    } else {
      systemPrompt += `You are talking to a general user or guest. Guide them to register as a worker or employer if they ask about using the platform. `;
    }

    // Map history to the format Gemini expects if provided
    const chatHistory = history ? history.map(h => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    })) : [];

    // Prepend the system prompt as the first message if there's no history, or configure it via the model
    // Using simple history insertion for context
    const chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System Instruction: ${systemPrompt}\n\nPlease acknowledge these instructions and wait for my query.` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am the Skill Bridge assistant. How can I help you today?" }]
        },
        ...chatHistory
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ message: "An error occurred while communicating with the AI service.", error: error.message });
  }
};

// Simple rule-based fallback if no Gemini API Key is present
function handleLocalFallback(message, role, res) {
  const msg = message.toLowerCase();
  
  // Basic delay to simulate "typing"
  setTimeout(() => {
    let reply = "I'm sorry, I didn't quite catch that. How can I help you with SkillBridge today?";
    
    if (msg.includes("hello") || msg.includes("hi ") || msg === "hi" || msg.includes("hey")) {
      reply = "Hello there! 👋 Welcome to SkillBridge. How can I assist you today?";
    } else if (msg.includes("post") && msg.includes("job")) {
      reply = "To post a job, head over to your **Employer Dashboard** and fill out the 'Post a new job' form. You'll need to specify the role, budget, and required skills.";
    } else if (msg.includes("apply") || msg.includes("find job")) {
      reply = "If you're a registered Worker, go to the **Jobs** tab in your dashboard to see available listings. Click on any job to view details and apply directly!";
    } else if (msg.includes("worker") && msg.includes("book")) {
      reply = "You can book workers directly from their profile pages, or build a team by selecting multiple workers for the same job via the Employer Dashboard.";
    } else if (msg.includes("score") || msg.includes("reliability")) {
      reply = "Reliability Scores are calculated based on a worker's punctuality, job acceptance rate, and employer feedback. Higher scores mean better visibility!";
    } else if (msg.includes("pay") || msg.includes("money") || msg.includes("salary")) {
      reply = "Payments are handled securely on the platform. Employers can pay workers directly after a job is completed through the Worker Details modal.";
    }

    if (role === 'guest' && msg.includes("register")) {
      reply = "You can join SkillBridge today! Click the 'Register' button at the top right to get started as either an Employer or a skilled Worker.";
    }

    // Notice that it's operating in fallback mode
    reply += "\n\n*(Note: I am currently running in offline fallback mode without advanced AI capabilities.)*";

    return res.status(200).json({ reply });
  }, 1000);
}
