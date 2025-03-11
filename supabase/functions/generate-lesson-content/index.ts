
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
const MODEL_ID = "deepseek-ai/deepseek-r1:0767acf1502dd42cf295033525cdfc2ceb3d9b80d15585c472b420085f2e1fad"; 

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Edge function invoked: generate-lesson-content");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if the Replicate API key is set
    if (!REPLICATE_API_KEY) {
      console.error("REPLICATE_API_KEY is not set in the environment");
      return new Response(
        JSON.stringify({ 
          error: "REPLICATE_API_KEY is not set", 
          details: "Please add the Replicate API key in the Supabase Edge Function secrets"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData = await req.json();
    const { 
      title, 
      level = "beginner", 
      language = "english", 
      sections = [],
      instructions = "" 
    } = requestData;

    console.log(`Generating English lesson content for "${title}" at ${level} level`);
    if (instructions) {
      console.log(`With instructions: ${instructions}`);
    }

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    // Build the prompt for the AI model
    let prompt = `Create an English language lesson with the title "${title}" for ${level} level students.`;
    
    // If specific sections are requested, only generate those
    if (sections.length > 0) {
      prompt += ` Only include these sections: ${sections.join(", ")}.`;
    }
    
    // Add any additional instructions from the user
    if (instructions) {
      prompt += `\n\nAdditional instructions: ${instructions}`;
    }
    
    // Add format instructions
    prompt += `\n\nFormat the response as JSON with the following structure:
{
  "description": "A brief overview of the English lesson (2-3 sentences)",
  "objectives": ["List of 3-5 learning objectives for English learners"],
  "practicalSituations": ["List of 2-3 real-world scenarios where this English would be used"],
  "keyPhrases": [{"phrase": "English phrase", "translation": "translation in student's language if needed", "usage": "brief context"}],
  "vocabulary": [{"word": "English word", "translation": "translation if needed", "partOfSpeech": "noun/verb/etc"}],
  "explanations": ["2-3 paragraphs explaining key English language concepts"],
  "tips": ["3-5 tips for practicing or remembering this English content"]
}

Make sure the entire response is valid JSON. The content should be appropriate for ${level} level English students and focus specifically on the title topic.`;

    console.log("Creating prediction on Replicate API with Deepseek R1 model");
    
    try {
      // Create input parameters
      const input = {
        prompt: prompt,
        max_new_tokens: 2048,
        temperature: 0.7,
      };

      console.log("Input to Replicate API:", JSON.stringify(input, null, 2));
      
      // Start the prediction
      const prediction = await replicate.predictions.create({
        version: MODEL_ID,
        input: input,
      });

      console.log("Prediction created successfully. ID:", prediction.id);
      console.log("Prediction status:", prediction.status);

      // Return the prediction ID and URLs for the client to poll
      return new Response(
        JSON.stringify({
          id: prediction.id,
          status: prediction.status,
          urls: {
            get: `https://api.replicate.com/v1/predictions/${prediction.id}`,
            cancel: prediction.urls?.cancel,
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      console.error("Error when calling Replicate API:", fetchError);
      console.error("Stack trace:", fetchError.stack);
      return new Response(
        JSON.stringify({ 
          error: "Failed to communicate with Replicate API", 
          details: fetchError.message,
          stack: fetchError.stack
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-lesson-content function:", error);
    console.error("Stack trace:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
