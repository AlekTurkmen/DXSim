# Streaming Cancellation & Case Switch Handling

## Problem Addressed

When users switch between clinical cases while the AI is still generating text (streaming), the streaming response from the previous case would continue and get added to the new conversation instead of being properly cancelled. This resulted in:

1. **Mixed Content**: Previous case's AI response appearing in the new case's conversation
2. **UI Confusion**: Clinical vignette at top doesn't match the streaming content
3. **Data Corruption**: Conversation history contains responses from different cases
4. **Poor UX**: Users see irrelevant content when switching cases quickly

## Root Cause

The streaming implementation used a simple fetch with ReadableStream but had no mechanism to:
- Detect when the user switched to a different case mid-stream
- Cancel ongoing streaming requests
- Prevent stale streaming data from updating the UI

## Solution Implemented

### 1. Streaming State Tracking

Added refs to track streaming state across case switches:

```typescript
// Ref to track and cancel ongoing streaming requests
const streamingAbortControllerRef = useRef<AbortController | null>(null);
const currentStreamingCaseIdRef = useRef<string | null>(null);
```

### 2. Abort Controller Integration

Each streaming request now uses an AbortController:

```typescript
// Create abort controller for this streaming request
const abortController = new AbortController();
streamingAbortControllerRef.current = abortController;
currentStreamingCaseIdRef.current = currentCase.id;

const response = await fetch('/api/chat', {
  // ... other options
  signal: abortController.signal // Add abort signal
});
```

### 3. Case Switch Detection

The streaming loop continuously checks if the case has switched:

```typescript
while (true) {
  // Check if case has switched during streaming
  if (currentStreamingCaseIdRef.current !== currentCase?.id) {
    console.log('🛑 Aborting stream - case switched');
    reader.cancel();
    break;
  }
  
  const { done, value } = await reader.read();
  
  // Check again after reading
  if (currentStreamingCaseIdRef.current !== currentCase?.id) {
    console.log('🛑 Aborting stream after read - case switched');
    break;
  }
  
  // Process chunk with final check before UI update
  if (currentStreamingCaseIdRef.current !== currentCase?.id) {
    console.log('🛑 Aborting stream during chunk processing');
    return;
  }
}
```

### 4. Proactive Cancellation

Streaming is cancelled immediately when case switches are detected:

```typescript
// Cancel any ongoing streaming requests
const cancelOngoingStreaming = () => {
  if (streamingAbortControllerRef.current) {
    console.log('🛑 Cancelling ongoing streaming for case switch');
    streamingAbortControllerRef.current.abort();
    streamingAbortControllerRef.current = null;
    currentStreamingCaseIdRef.current = null;
    setIsStreaming(false);
    setIsLoading(false);
  }
};
```

This function is called:
- When setting a new case (if different from current)
- When the conversation resets due to caseId changes
- On component unmount for cleanup

### 5. Graceful Error Handling

Abort errors are handled gracefully without showing user error messages:

```typescript
} catch (error) {
  // Handle abort errors gracefully (user switched cases)
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('🛑 Streaming request aborted due to case switch');
    return; // Don't show error message for intentional aborts
  }
  
  // Only show error if still on same case
  if (currentStreamingCaseIdRef.current === currentCase?.id) {
    // Show error to user
  }
}
```

### 6. State Cleanup

Streaming state is cleaned up appropriately:

```typescript
} finally {
  // Clean up streaming state only if we're still on the same case
  if (currentStreamingCaseIdRef.current === currentCase?.id) {
    setIsLoading(false);
    setIsStreaming(false);
    streamingAbortControllerRef.current = null;
    currentStreamingCaseIdRef.current = null;
  }
}
```

## Implementation Flow

### Normal Streaming (No Case Switch)
1. User sends message → Streaming starts
2. AbortController created and case ID stored
3. Stream processes chunks and updates UI
4. Stream completes → State cleaned up

### Case Switch During Streaming
1. User sends message → Streaming starts for Case A
2. User switches to Case B mid-stream
3. `cancelOngoingStreaming()` called → AbortController.abort()
4. Streaming loop detects case mismatch → Exits gracefully
5. New conversation loads with Case B's clinical vignette
6. No contamination from Case A's stream

## Logging & Monitoring

### Console Output for Case Switches During Streaming

```
🚀 Starting streaming request for case: case-a-id
🛑 Cancelling ongoing streaming for case switch
🔄 Complete conversation reset due to caseId change: case-b-id
🛑 Aborting stream - case switched from case-a-id to case-b-id
🛑 Streaming request aborted due to case switch
✅ Displaying validated clinical vignette for: Case B Title
```

### Verification Points

1. **Stream Cancellation**: Look for "🛑 Cancelling ongoing streaming" logs
2. **Case Switch Detection**: Check for "🛑 Aborting stream - case switched" messages
3. **Clean Shutdown**: Verify "🛑 Streaming request aborted" without error messages
4. **Fresh Start**: Confirm new clinical vignette displays immediately

## Benefits

1. **Clean Transitions**: Case switches happen immediately without content mixing
2. **Resource Efficiency**: Cancelled streams don't waste bandwidth/processing
3. **Consistent UI**: New conversations always start with correct clinical vignette
4. **Better UX**: No confusing mixed content from different cases
5. **Memory Safety**: Proper cleanup prevents memory leaks

## Edge Cases Handled

- **Multiple Rapid Switches**: Each switch cancels previous streams
- **Component Unmount**: Cleanup prevents orphaned requests
- **Network Errors**: Graceful handling without user-facing errors
- **Partial Streams**: Safe abortion at any point in streaming process

## Testing Scenarios

To verify the fix works:

1. **Start Streaming**: Send a message and wait for response to start
2. **Quick Switch**: Immediately click "New Random Case" while streaming
3. **Verify Clean Switch**: New case should load with its clinical vignette only
4. **Check Console**: Look for abort and cancellation logs
5. **No Mixed Content**: Ensure no content from previous case appears

This implementation ensures that case switches during streaming are handled gracefully, providing users with a clean, responsive experience without content contamination between different clinical cases.
