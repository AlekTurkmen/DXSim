import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Validation function to ensure case data integrity (shared with cases API)
function validateCaseData(caseData: unknown): boolean {
  if (!caseData || typeof caseData !== 'object') return false;
  
  const data = caseData as Record<string, unknown>;
  const requiredFields = ['id', 'doi', 'title', 'clinical_vignette'];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      console.warn(`⚠️ Random case validation failed: Missing or empty ${field} for case ${data.id || 'unknown'}`);
      return false;
    }
  }
  
  return true;
}

export async function GET() {
  try {
    // First, get the total count of cases
    const { count, error: countError } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    if (countError || !count || count === 0) {
      console.error('Error getting case count:', countError);
      return NextResponse.json({
        success: false,
        error: 'No cases found'
      }, { status: 404 });
    }

    // Try up to 5 times to get a valid random case
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // Generate a random offset
      const randomOffset = Math.floor(Math.random() * count);

      // Get a random case using the offset
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .range(randomOffset, randomOffset)
        .limit(1);

      if (error) {
        console.error('Error fetching random case on attempt', attempt, ':', error);
        continue;
      }

      if (!cases || cases.length === 0) {
        console.warn('No case found at offset', randomOffset, 'on attempt', attempt);
        continue;
      }

      const randomCase = cases[0];
      
      // Validate the case data
      if (validateCaseData(randomCase)) {
        console.log(`✅ Valid random case found on attempt ${attempt}:`, randomCase.short_title);
        return NextResponse.json({
          success: true,
          case: randomCase
        });
      } else {
        console.warn(`⚠️ Invalid case data on attempt ${attempt}, trying again...`);
      }
    }

    // If we get here, we couldn't find a valid case after max attempts
    console.error(`❌ Failed to find valid random case after ${maxAttempts} attempts`);
    return NextResponse.json({
      success: false,
      error: 'Failed to find a valid random case'
    }, { status: 500 });

  } catch (error) {
    console.error('Random case API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
