// This is a Vercel Serverless Function, which acts as a secure backend.

// We are using the 'require' syntax for broader compatibility.
const fetch = require('node-fetch');

module.exports = async (request, response) => {
  // This part allows us to test if the function is live by visiting the URL.
  if (request.method === 'GET') {
    return response.status(200).json({ message: 'API is running correctly.' });
  }

  // This handles the real request from your webpage.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { businessType, primaryGoal } = request.body;
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return response.status(500).json({ error: 'API key is not configured.' });
    }

    const prompt = `Act as an expert marketing strategist. Generate exactly 5 creative, actionable, and unique marketing ideas for a small business.

    Business Type: ${businessType}
    Primary Goal: ${primaryGoal}

    For each idea, provide a short, compelling title and a 1-2 sentence description. The ideas should be innovative and practical for a small business to implement. Format the output as a valid JSON array of objects, where each object has a "title" and a "description" key. Example: [{"title": "Idea Title", "description": "Idea description."}]`;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRequestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error('Gemini API Error:', errorBody);
      return response.status(geminiResponse.status).json({ error: `Gemini API Error: ${errorBody.error.message}` });
    }

    const result = await geminiResponse.json();
    
    const text = result.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const aiIdeas = JSON.parse(cleanedText);

    return response.status(200).json(aiIdeas);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: `An internal server error occurred: ${error.message}` });
  }
};
