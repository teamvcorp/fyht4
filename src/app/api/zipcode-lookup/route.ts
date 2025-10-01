import { NextRequest, NextResponse } from 'next/server'
import { lookupZipCode, getStateFromZip } from '@/lib/zipcode'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const zipcode = url.searchParams.get('zip')

  if (!zipcode) {
    return NextResponse.json({ error: 'ZIP code required' }, { status: 400 })
  }

  // Clean the ZIP code
  const cleanZip = zipcode.replace(/\D/g, '').slice(0, 5)
  if (cleanZip.length !== 5) {
    return NextResponse.json({ error: 'Invalid ZIP code format' }, { status: 400 })
  }

  try {
    // Try the external API first
    const data = await lookupZipCode(cleanZip)
    
    if (data) {
      return NextResponse.json({
        zipcode: data.zipcode,
        city: data.city,
        state: data.stateCode,
        fullState: data.state
      })
    }

    // Fallback to basic state lookup
    const stateCode = getStateFromZip(cleanZip)
    if (stateCode) {
      return NextResponse.json({
        zipcode: cleanZip,
        city: null,
        state: stateCode,
        fullState: null
      })
    }

    return NextResponse.json({ error: 'ZIP code not found' }, { status: 404 })
  } catch (error) {
    console.error('ZIP lookup error:', error)
    return NextResponse.json({ error: 'Lookup service unavailable' }, { status: 503 })
  }
}