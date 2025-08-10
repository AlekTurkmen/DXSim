import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Case, CasesResponse } from '@/lib/types'

// Validation function to ensure case data integrity
function validateCaseData(caseData: unknown): caseData is Case {
  if (!caseData || typeof caseData !== 'object') return false;
  
  const data = caseData as Record<string, unknown>;
  const requiredFields = ['id', 'doi', 'title', 'clinical_vignette'];
  
  for (const field of requiredFields) {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      console.warn(`⚠️ Case validation failed: Missing or empty ${field} for case ${data.id || 'unknown'}`);
      return false;
    }
  }
  
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataset = searchParams.get('dataset')

    let query = supabase
      .from('cases')
      .select('*')
      .order('date_added', { ascending: false })

    // Filter by dataset if provided
    if (dataset) {
      query = query.eq('dataset', dataset)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { cases: [], error: 'Failed to fetch cases' } as CasesResponse,
        { status: 500 }
      )
    }

    // Validate all case data before returning
    const validCases: Case[] = (data || []).filter(validateCaseData);
    const invalidCount = (data || []).length - validCases.length;
    
    if (invalidCount > 0) {
      console.warn(`⚠️ Filtered out ${invalidCount} invalid case records`);
    }

    console.log(`✅ Returning ${validCases.length} validated cases`);
    return NextResponse.json({ cases: validCases } as CasesResponse)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { cases: [], error: 'Internal server error' } as CasesResponse,
      { status: 500 }
    )
  }
}
