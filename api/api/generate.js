// This is a Vercel Serverless Function, which acts as a secure backend.

export default async function handler(request, response) {
  // Ensure the request is a POST request, as expected.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get the user's selections from the request body.
    const { businessType, primaryGoal } = request.body;
    
    // Get the secret API key securely from Vercel's environment variables.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      // If the key is missing, return an error.
      return response.status(500).json({ error: 'API key is not configured.' });
    }

    // Construct the prompt to send to the AI model.
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

    // Make the secure call to the Google Gemini API.
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
    
    // Extract and clean the text response from the AI.
    const text = result.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const aiIdeas = JSON.parse(cleanedText);

    // Send the generated ideas back to the webpage.
    return response.status(200).json(aiIdeas);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: `An internal server error occurred: ${error.message}` });
  }
}
