import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import path from 'path';

// Type for uploaded file from Google AI
interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
}

// Import shared state from initialize route
let uploadedFile: UploadedFile | null = null;
let systemPrompt: string | null = null;
let ai: GoogleGenAI | null = null;
let currentCaseId: string | null = null; // Track current case to detect switches

// Helper function to extract case ID from DOI
function extractCaseIdFromDOI(doi: string): string | null {
  const match = doi.match(/NEJMcpc(\d+)$/);
  return match ? match[1] : null;
}

// Get cached Gemini URI from Supabase (fast lookup)
async function getCachedGeminiFile(caseData: {id: string, doi: string}): Promise<UploadedFile | null> {
  try {
    const { data: caseRecord, error: fetchError } = await supabase
      .from('cases')
      .select('gemini_file_uri, gemini_file_uploaded_at')
      .eq('id', caseData.id)
      .single();

    if (fetchError || !caseRecord?.gemini_file_uri) {
      const caseId = extractCaseIdFromDOI(caseData.doi);
      console.log(`⚠️ No cached Gemini file found for case ${caseId}. Run the batch upload script first.`);
      return null;
    }

    // Check if file is still valid (within 47 hours)
    const uploadedAt = new Date(caseRecord.gemini_file_uploaded_at).getTime();
    const isStillValid = (Date.now() - uploadedAt) < (47 * 60 * 60 * 1000);
    
    if (!isStillValid) {
      const caseId = extractCaseIdFromDOI(caseData.doi);
      console.log(`⚠️ Cached Gemini file for case ${caseId} has expired. Re-run batch upload.`);
      return null;
    }

    const caseId = extractCaseIdFromDOI(caseData.doi);
    console.log(`✅ Using cached Gemini file for case ${caseId}:`, caseRecord.gemini_file_uri);
    
    return {
      uri: caseRecord.gemini_file_uri,
      mimeType: 'application/pdf',
      name: `nejm-case-${caseId}.pdf`
    };

  } catch (error) {
    console.error('❌ Error fetching cached Gemini file:', error);
    return null;
  }
}

// Initialize AI if not already initialized and ensure correct case context
async function ensureInitialized(caseData?: {id: string, doi: string}) {
  if (!ai) {
    try {
      const promptPath = path.join(process.cwd(), 'public', 'prompts', 'gatekeeper-system-prompt.txt');
      systemPrompt = readFileSync(promptPath, 'utf-8');
      
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY!,
      });
      
      console.log('🤖 AI initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing AI:', error);
      throw error;
    }
  }

  // Handle case switching and ensure correct PDF context
  if (caseData && caseData.doi) {
    const newCaseId = caseData.id;
    
    // Check if we need to switch PDF context for a different case
    if (currentCaseId !== newCaseId) {
      console.log('🔄 Chat: Detected case switch from', currentCaseId, 'to', newCaseId);
      
      // Always get the correct PDF for this case
      const newUploadedFile = await getCachedGeminiFile(caseData);
      
      if (newUploadedFile) {
        uploadedFile = newUploadedFile;
        currentCaseId = newCaseId;
        console.log('📄 Chat: PDF context updated for case:', newCaseId);
        console.log('📎 New PDF URI:', newUploadedFile.uri);
      } else {
        uploadedFile = null;
        console.log('⚠️ Chat: No cached file available for case:', newCaseId);
      }
    } else if (!uploadedFile) {
      // Same case but no PDF loaded yet
      uploadedFile = await getCachedGeminiFile(caseData);
      if (uploadedFile) {
        console.log('📄 Chat: PDF context loaded for current case:', newCaseId);
      }
    } else {
      console.log('✅ Chat: Using existing PDF context for case:', currentCaseId);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, caseData } = await request.json().catch(() => ({ message: '', conversationHistory: [] }));
    
    // Ensure AI is initialized with cached PDF data
    await ensureInitialized(caseData);
    
    if (!ai || !systemPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Gatekeeper not initialized'
      }, { status: 400 });
    }
    
    const genConfig = {
      thinkingConfig: {
        thinkingBudget: -1,
      },
      responseMimeType: 'text/plain',
      systemInstruction: [
        {
          text: systemPrompt,
        }
      ],
    };
    
    const model = 'gemini-2.5-flash';
    
    // Build conversation history
    const contents: Array<{
      role: string;
      parts: Array<{ fileData?: { fileUri: string; mimeType: string }; text?: string }>;
    }> = [];

    // Include the PDF file data for context if we have a cached Gemini file URI
    if (uploadedFile && uploadedFile.uri && uploadedFile.uri.startsWith('https://generativelanguage.googleapis.com/')) {
      contents.push({
        role: 'user',
        parts: [
          {
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: uploadedFile.mimeType,
            },
          }
        ],
      });
      console.log('📄 PDF context added to conversation');
    } else {
      console.log('⚠️ No PDF context available - continuing without file context');
    }
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Ensure we have at least one content item
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use generateContent method and simulate streaming by chunking the response
          const response = await ai!.models.generateContent({
            model,
            config: genConfig,
            contents,
          });

          const fullResponse = response.text || '';
          
          // Simulate streaming by chunking the response word by word
          const words = fullResponse.split(' ');
          let accumulatedText = '';
          
          for (let i = 0; i < words.length; i++) {
            const currentWord = words[i];
            const wordToAdd = i === 0 ? currentWord : ' ' + currentWord;
            accumulatedText += wordToAdd;
            
            // Send each word as a chunk
            const data = JSON.stringify({
              type: 'chunk',
              content: wordToAdd,
              fullContent: accumulatedText
            });
            
            controller.enqueue(`data: ${data}\n\n`);
            
            // Add small delay to simulate real streaming (faster for better UX)
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Send final message
          const finalData = JSON.stringify({
            type: 'done',
            content: fullResponse
          });
          controller.enqueue(`data: ${finalData}\n\n`);
          
          controller.close();
        } catch (error) {
          console.error('💥 Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorData = JSON.stringify({
            type: 'error',
            error: `Failed to process message: ${errorMessage}`
          });
          controller.enqueue(`data: ${errorData}\n\n`);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (error) {
    console.error('💥 Chat error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process message'
    }, { status: 500 });
  }
}