// Simple ZIP code to city/state lookup utility
// Uses a free ZIP code API service

export interface ZipCodeData {
  zipcode: string
  city: string
  state: string
  stateCode: string
}

export async function lookupZipCode(zipcode: string): Promise<ZipCodeData | null> {
  try {
    // Clean and validate ZIP code
    const cleanZip = zipcode.replace(/\D/g, '').slice(0, 5)
    if (cleanZip.length !== 5) {
      return null
    }

    // Use the free Zippopotam.us API
    const response = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      headers: {
        'User-Agent': 'FYHT4-Project-Lookup/1.0'
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data && data.places && data.places[0]) {
      const place = data.places[0]
      return {
        zipcode: cleanZip,
        city: place['place name'] || '',
        state: place['state'] || '',
        stateCode: place['state abbreviation'] || ''
      }
    }

    return null
  } catch (error) {
    console.error('ZIP code lookup failed:', error)
    return null
  }
}

// Fallback function that tries to extract state from ZIP code ranges
// This is a basic fallback if the API is unavailable
export function getStateFromZip(zipcode: string): string | null {
  const zip = parseInt(zipcode.slice(0, 5))
  
  if (zip >= 99501 && zip <= 99950) return 'AK' // Alaska
  if (zip >= 35004 && zip <= 36925) return 'AL' // Alabama
  if (zip >= 71601 && zip <= 72959) return 'AR' // Arkansas
  if (zip >= 85001 && zip <= 86556) return 'AZ' // Arizona
  if (zip >= 90001 && zip <= 96162) return 'CA' // California
  if (zip >= 80001 && zip <= 81658) return 'CO' // Colorado
  if (zip >= 6001 && zip <= 6928) return 'CT' // Connecticut
  if (zip >= 19701 && zip <= 19980) return 'DE' // Delaware
  if (zip >= 32004 && zip <= 34997) return 'FL' // Florida
  if (zip >= 30001 && zip <= 39901) return 'GA' // Georgia
  if (zip >= 96701 && zip <= 96898) return 'HI' // Hawaii
  if (zip >= 50001 && zip <= 52809) return 'IA' // Iowa
  if (zip >= 83201 && zip <= 83877) return 'ID' // Idaho
  if (zip >= 60001 && zip <= 62999) return 'IL' // Illinois
  if (zip >= 46001 && zip <= 47997) return 'IN' // Indiana
  if (zip >= 66002 && zip <= 67954) return 'KS' // Kansas
  if (zip >= 40003 && zip <= 42788) return 'KY' // Kentucky
  if (zip >= 70001 && zip <= 71497) return 'LA' // Louisiana
  if (zip >= 1001 && zip <= 2791) return 'MA' // Massachusetts
  if (zip >= 20588 && zip <= 21930) return 'MD' // Maryland
  if (zip >= 3901 && zip <= 4992) return 'ME' // Maine
  if (zip >= 48001 && zip <= 49971) return 'MI' // Michigan
  if (zip >= 55001 && zip <= 56763) return 'MN' // Minnesota
  if (zip >= 63001 && zip <= 65899) return 'MO' // Missouri
  if (zip >= 38601 && zip <= 39776) return 'MS' // Mississippi
  if (zip >= 59001 && zip <= 59937) return 'MT' // Montana
  if (zip >= 27006 && zip <= 28909) return 'NC' // North Carolina
  if (zip >= 58001 && zip <= 58856) return 'ND' // North Dakota
  if (zip >= 68001 && zip <= 69367) return 'NE' // Nebraska
  if (zip >= 3031 && zip <= 3897) return 'NH' // New Hampshire
  if (zip >= 7001 && zip <= 8989) return 'NJ' // New Jersey
  if (zip >= 87001 && zip <= 88441) return 'NM' // New Mexico
  if (zip >= 89001 && zip <= 89883) return 'NV' // Nevada
  if (zip >= 10001 && zip <= 14975) return 'NY' // New York
  if (zip >= 43001 && zip <= 45999) return 'OH' // Ohio
  if (zip >= 73001 && zip <= 74966) return 'OK' // Oklahoma
  if (zip >= 97001 && zip <= 97920) return 'OR' // Oregon
  if (zip >= 15001 && zip <= 19640) return 'PA' // Pennsylvania
  if (zip >= 2801 && zip <= 2940) return 'RI' // Rhode Island
  if (zip >= 29001 && zip <= 29948) return 'SC' // South Carolina
  if (zip >= 57001 && zip <= 57799) return 'SD' // South Dakota
  if (zip >= 37010 && zip <= 38589) return 'TN' // Tennessee
  if (zip >= 73301 && zip <= 88595) return 'TX' // Texas
  if (zip >= 84001 && zip <= 84791) return 'UT' // Utah
  if (zip >= 22001 && zip <= 24658) return 'VA' // Virginia
  if (zip >= 5001 && zip <= 5907) return 'VT' // Vermont
  if (zip >= 98001 && zip <= 99403) return 'WA' // Washington
  if (zip >= 53001 && zip <= 54990) return 'WI' // Wisconsin
  if (zip >= 24701 && zip <= 26886) return 'WV' // West Virginia
  if (zip >= 82001 && zip <= 83128) return 'WY' // Wyoming
  
  return null
}