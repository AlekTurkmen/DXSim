import { NextResponse } from 'next/server';
// import { readFileSync } from 'fs'; // Currently unused
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
// import path from 'path'; // Currently unused

// Type for uploaded file from Google AI
interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
}

// Global variables for this module
let uploadedFile: UploadedFile | null = null;
// let systemPrompt: string | null = null; // Currently unused in this module
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

// Initialize AI and system prompt
async function initializeAI() {
  try {
    // Read the system prompt from the root of the MVP directory
    // const promptPath = path.join(process.cwd(), 'gatekeeper-system-prompt.md');
    // systemPrompt = readFileSync(promptPath, 'utf-8'); // Currently not used in this module
    
    // Initialize Google AI
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
    });
    
    console.log('🤖 AI initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing AI:', error);
    throw error;
  }
}

// Legacy support for non-case-specific scenarios (deprecated)
async function legacyInitialize() {
  try {
    if (!ai) {
      await initializeAI();
    }

    console.log('⚠️ Warning: Using legacy initialization without case-specific PDF');
    
    return 'Legacy initialization completed. Please use case-specific initialization for proper PDF context.';
  } catch (error) {
    console.error('❌ Error in legacy initialization:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { caseId, caseData } = body;
    console.log('🔄 Initialize API called with:', { caseId, caseData: caseData ? { ...caseData, clinical_vignette: caseData.clinical_vignette ? 'present' : 'missing' } : 'no case data' });
    
    // For case-specific initialization, use cached Gemini files for instant setup
    if (caseData && caseData.clinical_vignette) {
      const newCaseId = caseData.id;
      
      // Check if we're switching to a different case
      if (currentCaseId && currentCaseId !== newCaseId) {
        console.log('🔄 Switching from case', currentCaseId, 'to', newCaseId);
        console.log('♻️ Resetting AI session for new case');
        
        // Reset session state for new case
        uploadedFile = null;
        // Keep AI instance but ensure fresh context
      } else if (!currentCaseId) {
        console.log('🆕 First case initialization:', newCaseId);
      } else {
        console.log('🔁 Re-initializing same case:', newCaseId);
      }
      
      // Update current case ID
      currentCaseId = newCaseId;
      
      console.log('🚀 Setting up case-specific session for:', caseData.short_title);
      
      // Initialize AI for this session
      await initializeAI();
      
      // Always get the correct Gemini file for this case (even if switching)
      if (caseData.doi) {
        const newUploadedFile = await getCachedGeminiFile(caseData);
        
        if (newUploadedFile) {
          // Always update to the new case's PDF
          uploadedFile = newUploadedFile;
          console.log('⚡ Fast initialization using cached Gemini file for case:', newCaseId);
          console.log('📄 PDF context updated to:', newUploadedFile.uri);
        } else {
          uploadedFile = null;
          console.log('⚠️ No cached file available for case:', newCaseId);
          console.log('💡 Consider running the batch upload script in "2.8 Upload pdfs to Gemini/" folder');
        }
      }
      
      return NextResponse.json({
        success: true,
        fileUri: uploadedFile?.uri || 'no-pdf-available',
        initialResponse: caseData.clinical_vignette,
        caseId: newCaseId // Return case ID for verification
      });
    }

    // For non-case-specific initialization (legacy support)
    let initialResponse: string;
    
    if (!uploadedFile) {
      initialResponse = await legacyInitialize();
    } else {
      initialResponse = 'Case already initialized. Ready for your commands.';
    }
    
    return NextResponse.json({
      success: true,
      fileUri: uploadedFile?.uri || 'no-file',
      initialResponse: initialResponse
    });
  } catch (error) {
    console.error('💥 Initialize error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize gatekeeper'
    }, { status: 500 });
  }
}