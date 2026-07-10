// ============================================================
// GOOGLE PLACES API PROVIDER
// Uses Places API (New) - Text Search
// Free tier: ~10,000 requests/month per product
// ============================================================

export interface GooglePlaceResult {
  name: string;
  formatted_address: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  business_status?: string;
  geometry?: { location: { lat: number; lng: number } };
}

export interface NormalizedPlaceResult {
  company_name: string;
  website: string | null;
  location_country: string | null;
  location_city: string | null;
  address: string | null;
  industry: string | null;
  google_rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Search Google Places API for businesses matching the query.
 * Returns null if API key is not configured (falls back to AI).
 */
export async function searchGooglePlaces(query: string): Promise<NormalizedPlaceResult[] | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null; // No key configured, use AI fallback

  try {
    // Use Places API Text Search (New)
    const url = `https://places.googleapis.com/v1/places:searchText`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location',
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 20,
      }),
    });

    if (!response.ok) {
      console.error('Google Places API error:', response.status, await response.text());
      return null; // Fall back to AI
    }

    const data = await response.json();
    const places = data.places || [];

    return places.map((place: Record<string, unknown>): NormalizedPlaceResult => {
      const displayName = place.displayName as { text?: string } | undefined;
      const location = place.location as { latitude?: number; longitude?: number } | undefined;
      const address = (place.formattedAddress as string) || '';
      const parts = address.split(',').map((s: string) => s.trim());

      return {
        company_name: displayName?.text || 'Unknown',
        website: (place.websiteUri as string) || null,
        location_country: parts.length > 0 ? parts[parts.length - 1] : null,
        location_city: parts.length > 1 ? parts[parts.length - 2] : null,
        address,
        industry: inferIndustry(place.types as string[] || []),
        google_rating: (place.rating as number) || null,
        review_count: (place.userRatingCount as number) || null,
        lat: location?.latitude || null,
        lng: location?.longitude || null,
      };
    });
  } catch (error) {
    console.error('Google Places search failed:', error);
    return null; // Fall back to AI
  }
}

function inferIndustry(types: string[]): string | null {
  const mapping: Record<string, string> = {
    restaurant: 'Restaurant & Food Service',
    hotel: 'Hospitality & Hotels',
    lodging: 'Hospitality & Hotels',
    travel_agency: 'Travel & Tourism',
    car_dealer: 'Automotive',
    real_estate_agency: 'Real Estate',
    dentist: 'Healthcare - Dental',
    doctor: 'Healthcare',
    hospital: 'Healthcare',
    gym: 'Fitness & Wellness',
    spa: 'Beauty & Wellness',
    hair_care: 'Beauty & Personal Care',
    clothing_store: 'Retail - Fashion',
    electronics_store: 'Retail - Electronics',
    furniture_store: 'Retail - Furniture',
    home_goods_store: 'Retail - Home Goods',
    shopping_mall: 'Retail - Shopping Center',
    school: 'Education',
    university: 'Education - Higher',
    lawyer: 'Legal Services',
    accounting: 'Financial Services',
    bank: 'Banking & Finance',
    insurance_agency: 'Insurance',
    store: 'Retail',
    cafe: 'Food & Beverage',
    bar: 'Food & Beverage',
    bakery: 'Food & Beverage',
  };

  for (const type of types) {
    if (mapping[type]) return mapping[type];
  }
  return types[0]?.replace(/_/g, ' ') || null;
}
