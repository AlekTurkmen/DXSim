'use client';
import { AppSidebar } from "@/components/app-sidebar"
import { PageHeader } from "@/components/page-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card"
import { LiquidGlassCard as LiquidGlass } from "@/components/ui/liquid-glass"
import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Case } from "@/lib/types"

// Cookie utility functions (currently unused but kept for future features)
// const getCookie = (name: string): string | null => {
//   if (typeof document === 'undefined') return null;
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
//   return null;
// };

// const setCookie = (name: string, value: string, days: number = 7): void => {
//   if (typeof document === 'undefined') return;
//   const expires = new Date();
//   expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
//   document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
// };

const deleteCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; SameSite=Strict`;
};

// Clear the cached initial response (useful for debugging or when switching cases)
const clearCachedResponse = (): void => {
  deleteCookie('initial_case_response');
  console.log('Cached initial response cleared');
};

// Type definition for conversation messages
interface ConversationMessage {
  role: string;
  action?: string;
  message: string;
}

// Type definition for API conversation history
interface APIConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

type ActionType = 'Question' | 'Test' | 'Diagnosis';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get('case');
  
  const [selectedAction, setSelectedAction] = useState<ActionType>('Question');
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<APIConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGeminiInitialized, setIsGeminiInitialized] = useState(false);
  const [currentCase, setCurrentCase] = useState<Case | null>(null);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to track the current case ID being loaded to prevent race conditions
  const loadingCaseIdRef = useRef<string | null>(null);
  
  // Ref to track and cancel ongoing streaming requests
  const streamingAbortControllerRef = useRef<AbortController | null>(null);
  const currentStreamingCaseIdRef = useRef<string | null>(null);

  // Validation function to ensure case data integrity
  const validateCaseData = useCallback((caseData: Case | null): boolean => {
    if (!caseData) {
      console.error('❌ Case validation failed: No case data');
      return false;
    }
    
    if (!caseData.id || !caseData.doi || !caseData.title) {
      console.error('❌ Case validation failed: Missing required fields', {
        hasId: !!caseData.id,
        hasDoi: !!caseData.doi,
        hasTitle: !!caseData.title
      });
      return false;
    }
    
    if (!caseData.clinical_vignette || caseData.clinical_vignette.trim().length === 0) {
      console.error('❌ Case validation failed: Missing or empty clinical vignette for case', caseData.id);
      return false;
    }
    
    if (!caseData.short_title || caseData.short_title.trim().length === 0) {
      console.warn('⚠️ Case validation warning: Missing short_title for case', caseData.id);
      // Don't fail validation, but log warning
    }
    
    console.log('✅ Case validation passed for:', caseData.short_title || caseData.id);
    return true;
  }, []);

  // Cancel any ongoing streaming requests
  const cancelOngoingStreaming = useCallback(() => {
    if (streamingAbortControllerRef.current) {
      console.log('🛑 Cancelling ongoing streaming for case switch');
      streamingAbortControllerRef.current.abort();
      streamingAbortControllerRef.current = null;
      currentStreamingCaseIdRef.current = null;
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // Safe case setter that validates data before setting
  const setCurrentCaseSafely = useCallback((caseData: Case | null) => {
    if (caseData && validateCaseData(caseData)) {
      console.log('📝 Setting case safely:', caseData.short_title, 'with vignette length:', caseData.clinical_vignette?.length);
      
      // Cancel any ongoing streaming from previous case
      if (currentCase && currentCase.id !== caseData.id) {
        cancelOngoingStreaming();
      }
      
      setCurrentCase(caseData);
      setCaseLoadError(null);
    } else {
      console.error('❌ Rejecting invalid case data');
      setCaseLoadError('Invalid case data received');
      setCurrentCase(null);
    }
  }, [currentCase, validateCaseData, cancelOngoingStreaming]);

  // Placeholders for different command types (memoized for performance)
  const placeholders = useMemo(() => ({
    'Question': 'Could you describe in detail your sore throat...',
    'Test': 'Factor XIII activity assay (clot solubility and quantitative activity level)',
    'Diagnosis': 'Erdheim-Chester disease'
  }), []);

  // Response labels for different command types (memoized for performance)
  const responseLabels = useMemo(() => ({
    'Question': { icon: '👤', label: 'Patient' },
    'Test': { icon: '📋', label: 'Test Results' },
    'Diagnosis': { icon: '🏆', label: 'Final Diagnosis' }
  }), []);

  // Simplified textarea height adjustment
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 160; // Roughly 5-6 lines
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${Math.max(44, newHeight)}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  // Scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Early useEffect hooks that don't depend on functions declared later
  useEffect(() => {
    scrollToBottom();
  }, [conversation, scrollToBottom]);

  // Reset conversation and related states when caseId changes (for New Random Case button)
  useEffect(() => {
    // Cancel any ongoing streaming first
    cancelOngoingStreaming();
    
    // Reset all conversation-related states when caseId changes
    setConversation([]);
    setConversationHistory([]);
    setIsGeminiInitialized(false); // Force re-initialization with new case
    setIsInitialized(false);
    setCaseLoadError(null);
    console.log('🔄 Complete conversation reset due to caseId change:', caseId);
    console.log('♻️ AI will be re-initialized with new case context');
  }, [caseId, cancelOngoingStreaming]);

  // Cleanup streaming on component unmount
  useEffect(() => {
    return () => {
      if (streamingAbortControllerRef.current) {
        console.log('🧹 Cleaning up streaming on component unmount');
        streamingAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Load case data from API with race condition prevention
  const loadCase = useCallback(async (targetCaseId: string) => {
    try {
      setIsLoadingCase(true);
      setCaseLoadError(null);
      
      // Prevent race conditions by tracking the current loading request
      loadingCaseIdRef.current = targetCaseId;
      console.log('🔄 Loading case data for:', targetCaseId);
      
      // For now, we'll need to get the case from all datasets since we don't know which dataset it belongs to
      // In a real implementation, you might want to add a case-specific API endpoint
      const response = await fetch('/api/cases');
      
      // Check if this request is still relevant (user might have navigated away)
      if (loadingCaseIdRef.current !== targetCaseId) {
        console.log('⏭️ Abandoning case load for', targetCaseId, '- newer request in progress');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Double-check race condition
      if (loadingCaseIdRef.current !== targetCaseId) {
        console.log('⏭️ Abandoning case load for', targetCaseId, '- newer request completed');
        return;
      }
      
      if (data.cases) {
        const foundCase = data.cases.find((c: Case) => c.id === targetCaseId);
        if (foundCase) {
          console.log('✅ Case found:', foundCase.short_title);
          setCurrentCaseSafely(foundCase);
        } else {
          console.error('❌ Case not found in dataset:', targetCaseId);
          setCaseLoadError(`Case ${targetCaseId} not found`);
          setCurrentCase(null);
        }
      } else {
        console.error('❌ No cases returned from API');
        setCaseLoadError('No cases returned from server');
        setCurrentCase(null);
      }
    } catch (error) {
      console.error('💥 Error loading case:', error);
      
      // Only set error if this is still the current request
      if (loadingCaseIdRef.current === targetCaseId) {
        setCaseLoadError(`Failed to load case: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setCurrentCase(null);
      }
    } finally {
      // Only clear loading state if this is still the current request
      if (loadingCaseIdRef.current === targetCaseId) {
        setIsLoadingCase(false);
        loadingCaseIdRef.current = null;
      }
    }
  }, [setCurrentCaseSafely]);

  // Load a random case with the same safeguards
  const loadRandomCase = useCallback(async () => {
    try {
      setIsLoadingCase(true);
      setCaseLoadError(null);
      
      // Clear any pending case load requests since we're getting a random case
      loadingCaseIdRef.current = 'random';
      console.log('🎲 Loading random case...');
      
      const response = await fetch('/api/random-case');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if we're still expecting a random case (user might have navigated)
      if (loadingCaseIdRef.current !== 'random') {
        console.log('⏭️ Abandoning random case load - newer request in progress');
        return;
      }
      
      if (data.success && data.case) {
        console.log('✅ Random case received:', data.case.short_title);
        setCurrentCaseSafely(data.case);
      } else {
        console.error('❌ Failed to load random case:', data.error);
        setCaseLoadError(data.error || 'Failed to load random case');
        setCurrentCase(null);
      }
    } catch (error) {
      console.error('💥 Error loading random case:', error);
      
      // Only set error if we're still expecting a random case
      if (loadingCaseIdRef.current === 'random') {
        setCaseLoadError(`Failed to load random case: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setCurrentCase(null);
      }
    } finally {
      // Only clear loading state if we're still expecting a random case
      if (loadingCaseIdRef.current === 'random') {
        setIsLoadingCase(false);
        loadingCaseIdRef.current = null;
      }
    }
  }, [setCurrentCaseSafely]);

  // Initialize Gemini AI only when needed (first user message) with validation
  const initializeGeminiIfNeeded = useCallback(async () => {
    try {
      // Validate that we have proper case data before initializing
      if (!currentCase || !validateCaseData(currentCase)) {
        throw new Error('Cannot initialize Gemini: Invalid or missing case data');
      }
      
      console.log('🤖 Initializing Gemini for validated case:', currentCase.short_title);
      console.log('📋 Case ID:', currentCase.id);
      console.log('📋 Case validation passed - proceeding with initialization');
      
      const response = await fetch('/api/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseId: caseId,
          caseData: currentCase
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Gemini initialized successfully for case:', currentCase.short_title);
      console.log('📄 PDF URI:', data.fileUri);
      console.log('🆔 Confirmed case ID:', data.caseId);
      return data.success;
    } catch (error) {
      console.error('💥 Error initializing Gemini:', error);
      throw error;
    }
  }, [currentCase, validateCaseData, caseId]);

  // Handle sending message with streaming and case validation
  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim() === '' || isLoading || isStreaming || !isInitialized) return;

    // Validate that we still have valid case data before sending message
    if (!currentCase || !validateCaseData(currentCase)) {
      console.error('❌ Cannot send message: Invalid case data');
      setConversation(prev => [...prev, {
        role: 'Error',
        message: 'Cannot send message: Case data is invalid. Please refresh and try again.'
      }]);
      return;
    }

    const userInput = inputValue.trim();
    const fullMessage = `[${selectedAction}] ${userInput}`;
    
    console.log('📤 Sending message for case:', currentCase.short_title, 'ID:', currentCase.id);
    console.log('🎯 Action type:', selectedAction, 'Message:', userInput.substring(0, 50) + '...');
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      role: 'Dr. Smith',
      action: selectedAction,
      message: userInput
    };

    setConversation(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }

    setIsLoading(true);

    // Initialize Gemini on first user message if not already initialized
    if (!isGeminiInitialized) {
      try {
        console.log('First user message - initializing Gemini...');
        await initializeGeminiIfNeeded();
        setIsGeminiInitialized(true);
        
        // Add the clinical vignette to conversation history for Gemini context
        if (currentCase && currentCase.clinical_vignette) {
          setConversationHistory([{
            role: 'assistant',
            content: currentCase.clinical_vignette
          }]);
        }
      } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        setConversation(prev => [...prev, {
          role: 'Error',
          message: 'Failed to initialize AI. Please refresh and try again.'
        }]);
        setIsLoading(false);
        return;
      }
    }

    // Get appropriate label for the response
    const responseInfo = responseLabels[selectedAction];
    
    // We'll add the AI message when we start receiving content, not before
    
    try {
      // Create abort controller for this streaming request
      const abortController = new AbortController();
      streamingAbortControllerRef.current = abortController;
      currentStreamingCaseIdRef.current = currentCase.id;
      
      console.log('🚀 Starting streaming request for case:', currentCase.id);
      
      // Use fetch with ReadableStream for Server-Sent Events streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullMessage,
          conversationHistory: conversationHistory,
          caseData: currentCase // Already validated above
        }),
        signal: abortController.signal // Add abort signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        setIsLoading(false); // Stop loading indicator once streaming begins
        setIsStreaming(true); // Start streaming indicator
        
        let aiMessageAdded = false; // Track if we've added the AI message yet
        
        while (true) {
          // Check if case has switched during streaming
          if (currentStreamingCaseIdRef.current !== currentCase?.id) {
            console.log('🛑 Aborting stream - case switched from', currentStreamingCaseIdRef.current, 'to', currentCase?.id);
            reader.cancel();
            break;
          }
          
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Check again after reading to ensure we're still on the same case
          if (currentStreamingCaseIdRef.current !== currentCase?.id) {
            console.log('🛑 Aborting stream after read - case switched');
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
                
                // Final check before updating conversation
                if (currentStreamingCaseIdRef.current !== currentCase?.id) {
                  console.log('🛑 Aborting stream during chunk processing - case switched');
                  return;
                }
                
                if (data.type === 'chunk') {
                  fullResponse += data.content;
                  
                  // Add AI message on first chunk if not already added
                  if (!aiMessageAdded) {
                    const initialAiMessage: ConversationMessage = {
                      role: responseInfo.label,
                      action: selectedAction,
                      message: fullResponse
                    };
                    setConversation(prev => [...prev, initialAiMessage]);
                    aiMessageAdded = true;
                  } else {
                    // Update the AI message in real-time
                    setConversation(prev => 
                      prev.map((msg, index) => 
                        index === prev.length - 1 
                          ? { ...msg, message: fullResponse }
                          : msg
                      )
                    );
                  }
                } else if (data.type === 'done') {
                  fullResponse = data.content;
                  
                  // Final check before completing
                  if (currentStreamingCaseIdRef.current !== currentCase?.id) {
                    console.log('🛑 Aborting stream at completion - case switched');
                    return;
                  }
                  
                  // Ensure AI message exists for final update
                  if (!aiMessageAdded) {
                    const finalAiMessage: ConversationMessage = {
                      role: responseInfo.label,
                      action: selectedAction,
                      message: fullResponse
                    };
                    setConversation(prev => [...prev, finalAiMessage]);
                  } else {
                    // Final update with complete response
                    setConversation(prev => 
                      prev.map((msg, index) => 
                        index === prev.length - 1 
                          ? { ...msg, message: fullResponse }
                          : msg
                      )
                    );
                  }
                  
                  // Update conversation history with the actual messages sent to AI
                  setConversationHistory(prev => [
                    ...prev,
                    { role: 'user', content: fullMessage },
                    { role: 'assistant', content: fullResponse }
                  ]);
                  
                  setIsStreaming(false); // Stop streaming indicator
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      }
      
    } catch (error) {
      // Handle abort errors gracefully (user switched cases)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Streaming request aborted due to case switch');
        return; // Don't show error message for intentional aborts
      }
      
      console.error('💥 Error sending message:', error);
      
      // Only add error message if we're still on the same case
      if (currentStreamingCaseIdRef.current === currentCase?.id) {
        setConversation(prev => [...prev, {
          role: 'Error',
          message: 'Error processing your request. Please try again.'
        }]);
      }
    } finally {
      // Clean up streaming state only if we're still on the same case
      if (currentStreamingCaseIdRef.current === currentCase?.id) {
        setIsLoading(false);
        setIsStreaming(false);
        streamingAbortControllerRef.current = null;
        currentStreamingCaseIdRef.current = null;
      }
    }
  }, [inputValue, isLoading, isStreaming, isInitialized, currentCase, validateCaseData, selectedAction, isGeminiInitialized, initializeGeminiIfNeeded, conversationHistory, responseLabels]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Load case data if case ID is provided (moved after function declarations)
  useEffect(() => {
    if (caseId) {
      loadCase(caseId);
    }
  }, [caseId]); // Remove loadCase from dependency array to prevent infinite loop

  // Load case and display clinical vignette directly without API calls
  useEffect(() => {
    // If no case ID is provided, get a random case first
    if (!caseId && !currentCase) {
      loadRandomCase();
    }
    
    // Add cache clearing function to window for debugging
    if (typeof window !== 'undefined') {
      (window as Window & {clearCachedResponse?: () => void}).clearCachedResponse = clearCachedResponse;
      console.log('Debug: Use window.clearCachedResponse() to clear cached initial response');
    }
  }, [caseId, currentCase]); // Remove loadRandomCase from dependency array to prevent infinite loop

  // When currentCase is loaded, safely display the clinical vignette with validation
  useEffect(() => {
    if (currentCase && validateCaseData(currentCase) && conversation.length === 0 && !isLoadingCase) {
      console.log('✅ Displaying validated clinical vignette for:', currentCase.short_title);
      console.log('📋 Case ID:', currentCase.id);
      console.log('📄 Vignette preview:', currentCase.clinical_vignette.substring(0, 100) + '...');
      
      // Reset Gemini initialization for new case to ensure fresh AI context
      if (isGeminiInitialized) {
        console.log('♻️ Resetting Gemini initialization for new case');
        setIsGeminiInitialized(false);
      }
      
      setConversation([{
        role: 'Clinical Vignette',
        message: currentCase.clinical_vignette
      }]);
      setIsInitialized(true); // Mark as ready for user input
    } else if (currentCase && !validateCaseData(currentCase)) {
      console.error('❌ Cannot display clinical vignette - case data validation failed');
      setCaseLoadError('Case data is incomplete');
    }
  }, [currentCase, conversation.length, isLoadingCase, isGeminiInitialized]); // Remove validateCaseData from dependency array

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden md:!mb-0 relative">
        <PageHeader 
          breadcrumbs={[
            { label: "DXSim", href: "/chat" },
            { 
              label: currentCase && validateCaseData(currentCase) 
                ? (currentCase.short_title || `Case ${currentCase.id.substring(0, 8)}`)
                : isLoadingCase 
                  ? "Loading Case..." 
                  : caseLoadError 
                    ? "Error Loading Case"
                    : "New Case", 
              isCurrentPage: true 
            }
          ]} 
        />
        
        {/* Scrollable Chat Area */}
        <main
          className="absolute inset-0 top-16 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          // Linear gradient style
          // style={{
          //   background:
          //     "linear-gradient(90deg, #F2FCFF 0%, #FFFFFF 20%, #FFFFFF 80%, #F2FCFF 100%)",
          //   scrollbarWidth: 'none', /* Firefox */
          //   msOverflowStyle: 'none', /* Internet Explorer 10+ */
          // }}
          style={{
            backgroundImage: "url('/images/bg-chat.jpg')",
            backgroundColor: 'black',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none', 
          }}
        >
          <div className="p-6 pb-24">
            <div className="mx-auto max-w-4xl">
              {/* Display case loading error if present */}
              {caseLoadError && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-red-200 font-medium">Case Loading Error</span>
                  </div>
                  <p className="text-red-100 mt-1">{caseLoadError}</p>
                  <button 
                    onClick={() => {
                      setCaseLoadError(null);
                      if (caseId) {
                        loadCase(caseId);
                      } else {
                        loadRandomCase();
                      }
                    }}
                    className="mt-2 px-3 py-1 bg-red-600/40 hover:bg-red-600/60 text-red-100 rounded text-sm transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              {/* Display loading state */}
              {isLoadingCase && (
                <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-blue-200">Loading case data...</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                {conversation.map((message, index) => {
                  const isDrSmith = message.role === 'Dr. Smith';
                  const isTestResults = message.role === 'Test Results';
                  const isDiagnosisResult = message.role === 'Final Diagnosis';
                  const isClinicalVignette = message.role === 'Clinical Vignette';
                  const isTest = message.action === 'Test';
                  const isQuestion = message.action === 'Question';
                  const isDiagnosis = message.action === 'Diagnosis';
                  
                  // Get background color based on role or action
                  const getBackgroundColor = () => {
                    if (isDrSmith) {
                      if (isQuestion) return 'bg-blue-500/20';
                      if (isTest) return 'bg-green-500/20';
                      if (isDiagnosis) return 'bg-red-500/20';
                      return 'bg-blue-500/20';
                    } else {
                      if (isTestResults) return 'bg-green-500/15';
                      if (isDiagnosisResult) return 'bg-red-500/15';
                      if (isClinicalVignette) return 'bg-purple-500/15'; // Clinical Vignette - purple
                      return 'bg-blue-500/15'; // Patient - changed to blue
                    }
                  };
                  
                  // Get role badge color - match message box colors
                  const getRoleBadgeColor = () => {
                    if (isDrSmith) {
                      if (isQuestion) return 'bg-blue-600/40 text-blue-100';
                      if (isTest) return 'bg-green-600/40 text-green-100';
                      if (isDiagnosis) return 'bg-red-600/40 text-red-100';
                      return 'bg-blue-600/40 text-blue-100';
                    } else {
                      if (isTestResults) return 'bg-green-600/40 text-green-100';
                      if (isDiagnosisResult) return 'bg-red-600/40 text-red-100';
                      if (isClinicalVignette) return 'bg-purple-600/40 text-purple-100'; // Clinical Vignette - purple
                      return 'bg-blue-600/40 text-blue-100'; // Patient - changed to blue
                    }
                  };
                  
                  // Get action badge color - match action types
                  const getActionBadgeColor = () => {
                    if (isTest) return 'bg-green-600/40 text-green-100';
                    if (isQuestion) return 'bg-blue-600/40 text-blue-100';
                    if (isDiagnosis) return 'bg-red-600/40 text-red-100';
                    return 'bg-purple-600/40 text-purple-100';
                  };
                  
                  return (
                    <div
                      key={index}
                      className={`flex ${isDrSmith ? 'justify-end' : 'justify-start'} mb-4`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] ${isDrSmith ? 'ml-2 md:ml-12' : 'mr-2 md:mr-12'}`}>
                        <LiquidGlassCard
                          className={`p-4 ${getBackgroundColor()}`}
                          blurIntensity="md"
                          glowIntensity="sm"
                          borderRadius="18px"
                        >
                          {/* Role Badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRoleBadgeColor()}`}>
                              {message.role}
                            </span>
                            {message.action && isDrSmith && (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getActionBadgeColor()}`}>
                                {message.action}
                              </span>
                            )}
                          </div>
                          
                          {/* Message Content */}
                          <div className={`text-sm md:text-lg leading-relaxed ${
                            isDrSmith ? 'text-gray-100' : 'text-gray-100'
                          }`}>
                            {message.message.startsWith('TABLE:') ? (
                              (() => {
                                const lines = message.message.split('\n');
                                const title = lines[0].replace('TABLE:', '').split('|')[0];
                                const headers = lines[0].replace('TABLE:', '').split('|').slice(1);
                                const rows = lines.slice(1).map(line => line.split('|'));
                                
                                return (
                                  <div>
                                    <h4 className="font-semibold mb-3 text-gray-50 text-sm md:text-base">{title}</h4>
                                    <div className="overflow-x-auto">
                                      <table className="w-full border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-400/30">
                                            {headers.map((header, idx) => (
                                              <th key={idx} className="text-left py-2 px-3 font-medium text-gray-100 text-sm md:text-base">
                                                {header}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {rows.map((row, rowIdx) => (
                                            <tr key={rowIdx} className="border-b border-gray-500/20">
                                              {row.map((cell, cellIdx) => (
                                                <td key={cellIdx} className="py-2 px-3 text-sm md:text-base text-gray-200">
                                                  {cell}
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <p>{message.message}</p>
                            )}
                          </div>
                        </LiquidGlassCard>
                      </div>
                    </div>
                  );
                })}
                
                {/* Loading indicator when AI is responding */}
                {(isLoading && conversation.length > 0) && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[85%] md:max-w-[70%] mr-2 md:mr-12">
                      <LiquidGlassCard
                        className={`p-4 ${selectedAction === 'Test' ? 'bg-green-500/15' : selectedAction === 'Diagnosis' ? 'bg-red-500/15' : 'bg-blue-500/15'}`}
                        blurIntensity="md"
                        glowIntensity="sm"
                        borderRadius="18px"
                        
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${selectedAction === 'Test' ? 'bg-green-600/40 text-green-100' : selectedAction === 'Diagnosis' ? 'bg-red-600/40 text-red-100' : 'bg-blue-600/40 text-blue-100'}`}>
                            {responseLabels[selectedAction].label}
                          </span>
                        </div>
                        <div className="text-sm md:text-lg text-gray-100 flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${selectedAction === 'Test' ? 'bg-green-300' : selectedAction === 'Diagnosis' ? 'bg-red-300' : 'bg-blue-300'}`}></div>
                            <div className={`w-2 h-2 rounded-full animate-pulse delay-100 ${selectedAction === 'Test' ? 'bg-green-300' : selectedAction === 'Diagnosis' ? 'bg-red-300' : 'bg-blue-300'}`}></div>
                            <div className={`w-2 h-2 rounded-full animate-pulse delay-200 ${selectedAction === 'Test' ? 'bg-green-300' : selectedAction === 'Diagnosis' ? 'bg-red-300' : 'bg-blue-300'}`}></div>
                          </div>
                        </div>
                      </LiquidGlassCard>
                    </div>
                  </div>
                )}
                
                {/* Scroll target */}
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>
        </main>
        
        {/* Fixed Chat Input Area - Overlaid */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-20 p-4"
          style={{ backgroundColor: 'transparent' }}
        >
          <div className="mx-auto max-w-4xl">
            {/* Input Area with Action Buttons Inline on Desktop, Stacked on Mobile */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Action Type Buttons - Full Width on Mobile, Inline Left on Desktop */}
              <div className="flex gap-2 flex-shrink-0 w-full md:w-auto justify-center md:justify-start">
                {(['Question', 'Test', 'Diagnosis'] as ActionType[]).map((action) => {
                  const isSelected = selectedAction === action;
                  const getColors = () => {
                    switch (action) {
                      case 'Question':
                        return isSelected 
                          ? 'bg-blue-500/80 text-blue-50' 
                          : 'bg-blue-500/20 text-blue-200';
                      case 'Test':
                        return isSelected 
                          ? 'bg-green-500/80 text-green-50' 
                          : 'bg-green-500/20 text-green-200';
                      case 'Diagnosis':
                        return isSelected 
                          ? 'bg-red-500/80 text-red-50' 
                          : 'bg-red-500/20 text-red-200';
                    }
                  };

                  return (
                    <div
                      key={action}
                      className="cursor-pointer"
                      onClick={() => setSelectedAction(action)}
                    >
                      <LiquidGlass
                        className={`px-3 py-2 transition-all duration-200 flex items-center justify-center ${getColors()}`}
                        blurIntensity="sm"
                        glowIntensity={isSelected ? "md" : "xs"}
                        borderRadius="10px"
                        
                        height="44px"
                      >
                        <span className="text-sm md:text-md font-semibold">{action}</span>
                      </LiquidGlass>
                    </div>
                  );
                })}
              </div>

              {/* Text Input and Send Button Container - Full Width on Mobile */}
              <div className="flex gap-3 w-full md:flex-1">
                {/* Text Input with Liquid Glass */}
                <div className="flex-1">
                  <LiquidGlass
                    className="bg-white/10 transition-all duration-200"
                    blurIntensity="sm"
                    glowIntensity="xs"
                    borderRadius="10px"
                    
                  >
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onInput={adjustTextareaHeight}
                      onKeyPress={handleKeyPress}
                      placeholder={placeholders[selectedAction]}
                      disabled={isLoading || isStreaming || !isInitialized || isLoadingCase || !!caseLoadError}
                      className="w-full resize-none focus:outline-none bg-transparent text-gray-100 placeholder-gray-400 border-none px-3 py-3 leading-normal block disabled:opacity-60"
                      rows={1}
                      style={{ 
                        minHeight: '44px',
                        background: 'transparent',
                        lineHeight: '1.5'
                      }}
                    />
                  </LiquidGlass>
                </div>

                {/* Send Button with Liquid Glass */}
                <div 
                  className={`flex-shrink-0 ${(isLoading || isStreaming || !isInitialized || isLoadingCase || !!caseLoadError) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={!isLoading && !isStreaming && isInitialized && !isLoadingCase && !caseLoadError ? handleSendMessage : undefined}
                >
                  <LiquidGlass
                    className="bg-blue-500/40 hover:bg-blue-500/60 text-white transition-all duration-200 p-3 flex items-center justify-center"
                    blurIntensity="sm"
                    glowIntensity="md"
                    borderRadius="10px"
                    
                    height="44px"
                  >
                    {(isLoading || isStreaming) ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                      </svg>
                    )}
                  </LiquidGlass>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}


