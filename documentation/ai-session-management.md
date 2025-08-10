# AI Session Management & Case Switching

## Problem Addressed

When users switch between different clinical cases, the AI conversation was maintaining context from the previous case, including the wrong PDF file context. This meant that while the UI correctly displayed the new case's clinical vignette and breadcrumb, the AI was still using the previous case's PDF for answering questions.

## Root Cause

The API routes (`/api/initialize` and `/api/chat`) were using global variables to store AI session state:

```typescript
let uploadedFile: UploadedFile | null = null;
let systemPrompt: string | null = null;
let ai: GoogleGenAI | null = null;
```

This caused several issues:
1. **PDF Context Persistence**: The `uploadedFile` was only updated when `null`, not when switching cases
2. **No Session Reset**: No mechanism to detect when a different case was being loaded
3. **Shared State**: All conversations shared the same AI instance and PDF context

## Solution Implemented

### 1. Case Tracking

Added `currentCaseId` tracking to both API routes:

```typescript
let currentCaseId: string | null = null; // Track current case to detect switches
```

### 2. Enhanced Initialize Route

The `/api/initialize` route now:

```typescript
// Check if we're switching to a different case
if (currentCaseId && currentCaseId !== newCaseId) {
  console.log('🔄 Switching from case', currentCaseId, 'to', newCaseId);
  console.log('♻️ Resetting AI session for new case');
  
  // Reset session state for new case
  uploadedFile = null;
}

// Always get the correct Gemini file for this case
const newUploadedFile = await getCachedGeminiFile(caseData);
if (newUploadedFile) {
  uploadedFile = newUploadedFile; // Always update
  console.log('📄 PDF context updated to:', newUploadedFile.uri);
}
```

### 3. Enhanced Chat Route

The `/api/chat` route now detects case switches:

```typescript
// Check if we need to switch PDF context for a different case
if (currentCaseId !== newCaseId) {
  console.log('🔄 Chat: Detected case switch from', currentCaseId, 'to', newCaseId);
  
  // Always get the correct PDF for this case
  const newUploadedFile = await getCachedGeminiFile(caseData);
  if (newUploadedFile) {
    uploadedFile = newUploadedFile;
    currentCaseId = newCaseId;
    console.log('📄 Chat: PDF context updated for case:', newCaseId);
  }
}
```

### 4. Frontend Session Reset

The frontend now properly resets AI initialization state:

```typescript
// Reset Gemini initialization for new case to ensure fresh AI context
if (isGeminiInitialized) {
  console.log('♻️ Resetting Gemini initialization for new case');
  setIsGeminiInitialized(false);
}
```

This ensures that when switching cases:
1. The frontend forces re-initialization
2. The backend detects the case switch
3. The correct PDF context is loaded
4. A fresh AI conversation begins

## Logging & Monitoring

### Enhanced Console Logging

The implementation includes comprehensive logging:

**Initialize Route:**
- `🆕 First case initialization: {caseId}`
- `🔄 Switching from case {oldId} to {newId}`
- `♻️ Resetting AI session for new case`
- `📄 PDF context updated to: {uri}`

**Chat Route:**
- `🔄 Chat: Detected case switch from {oldId} to {newId}`
- `📄 Chat: PDF context updated for case: {newId}`
- `✅ Chat: Using existing PDF context for case: {currentId}`

**Frontend:**
- `♻️ Resetting Gemini initialization for new case`
- `🤖 Initializing Gemini for validated case: {title}`
- `📋 Case ID: {id}`
- `📄 PDF URI: {uri}`

### Verification Steps

To verify the fix is working:

1. **Load First Case**: Check console for successful initialization
2. **Switch to New Case**: Look for case switch detection logs
3. **Send Message**: Verify correct PDF URI is being used
4. **Monitor Responses**: Ensure AI responses are contextual to current case

## Expected Log Flow

When switching from Case A to Case B:

```
// User navigates to new case
🔄 Complete conversation reset due to caseId change: case-b-id
♻️ AI will be re-initialized with new case context

// Backend detects case switch
🔄 Initialize API called with: {caseId: "case-b-id", ...}
🔄 Switching from case case-a-id to case-b-id
♻️ Resetting AI session for new case
📄 PDF context updated to: https://generativelanguage.googleapis.com/v1beta/files/new-file-id

// User sends first message to new case
🤖 Initializing Gemini for validated case: Case B Title
📄 PDF URI: https://generativelanguage.googleapis.com/v1beta/files/new-file-id
🔄 Chat: Using existing PDF context for case: case-b-id
📄 PDF context added to conversation
```

## Benefits

1. **Correct Context**: Each case conversation uses the proper PDF context
2. **Fresh Sessions**: No contamination between different case conversations
3. **Transparent Operation**: Comprehensive logging makes debugging easy
4. **Reliable Switching**: Robust detection and handling of case transitions
5. **User Experience**: Seamless case switching without manual refresh

## Maintenance

### Adding New Session State

When adding new global state variables:

1. Reset them in the case switching logic
2. Add appropriate logging
3. Update both initialize and chat routes
4. Consider frontend state management

### Troubleshooting

Common issues and solutions:

- **PDF not switching**: Check `currentCaseId` tracking in logs
- **AI using old context**: Verify `uploadedFile` is being updated
- **Initialization failures**: Check case data validation logs
- **Session persistence**: Ensure frontend `isGeminiInitialized` reset

This implementation ensures that AI conversations are properly isolated per case, with each case getting its own fresh conversation context and correct PDF file reference.
