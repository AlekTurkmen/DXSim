import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Dataset, DatasetsResponse } from '@/lib/types'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { datasets: [], error: 'Failed to fetch datasets' } as DatasetsResponse,
        { status: 500 }
      )
    }

    const datasets: Dataset[] = data || []

    return NextResponse.json({ datasets } as DatasetsResponse)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { datasets: [], error: 'Internal server error' } as DatasetsResponse,
      { status: 500 }
    )
  }
}
