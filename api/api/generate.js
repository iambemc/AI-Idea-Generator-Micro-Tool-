export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { businessType, primaryGoal } = await request.json();

    const prompt = `Act as an expert marketing strategist. Generate exactly 5 creative, actionable, and unique marketing ideas for a small business.

    Business Type: ${businessType}
    Primary Goal: ${primaryGoal}

    For each idea, provide a short, compelling title and a 1-2 sentence description. The ideas should be innovative and practical for a small business to implement. Format the output as a valid JSON array of objects, where each object has a "title" and a "description" key. Example: [{"title": "Idea Title", "description": "Idea description."}]`;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        throw new Error("API key is not configured.");
    }
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRequestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      console.error('Gemini API Error:', errorBody);
      return new Response(JSON.stringify({ error: `Gemini API Error: ${errorBody.error.message}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    
    const text = result.candidates[0].content.parts[0].text;
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const aiIdeas = JSON.parse(cleanedText);

    return new Response(JSON.stringify(aiIdeas), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in serverless function:', error);
    return new Response(JSON.stringify({ error: `An internal server error occurred: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
