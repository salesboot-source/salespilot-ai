import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { discoverProspects } from '@/lib/discovery/ai-discovery';
import { initDiscoveryTables } from '@/lib/discovery/db';
import { computeClientMatch } from '@/lib/discovery/match-engine';
import type { UserProfile } from '@/lib/discovery/types';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length < 2) {
      return Response.json(
        { success: false, message: 'Search query must be at least 2 characters.' },
        { status: 422 }
      );
    }

    const sql = getDb();

    // Ensure tables exist
    await initDiscoveryTables();

    // Load user profile for service context
    const profiles = await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`;
    const profile = profiles[0] || null;

    let userServices: string[] | undefined;
    let userIndustry: string | undefined;
    if (profile) {
      userIndustry = profile.industry;
      const parsed = typeof profile.products_services === 'string'
        ? JSON.parse(profile.products_services)
        : profile.products_services;
      if (Array.isArray(parsed) && parsed.length > 0) {
        userServices = parsed.map((p: { name: string }) => p.name).filter(Boolean);
      }
    }

    // Create search history entry
    const searchResult = await sql`
      INSERT INTO search_history (user_id, keyword, status)
      VALUES (${userId}, ${query.trim()}, 'in_progress')
      RETURNING *
    `;
    const searchId = searchResult[0].id;

    // Run AI discovery
    const rawProspects = await discoverProspects({
      query: query.trim(),
      user_services: userServices,
      user_industry: userIndustry,
    });

    // Run Ideal Client Match Engine
    const userProfile: UserProfile = {
      company_name: profile?.company_name || '',
      industry: userIndustry || '',
      services: userServices || [],
      target_market: profile?.target_market || undefined,
    };

    const prospects = await computeClientMatch(rawProspects, userProfile);

    // Persist results
    for (const p of prospects) {
      await sql`
        INSERT INTO prospect_results (
          user_id, search_id, company_name, website, location_country, location_city,
          industry, employee_count, estimated_revenue_min, estimated_revenue_max,
          technology_stack, scores, ai_rating_stars, ai_rating_action, reasoning, evidence,
          recommended_services, estimated_deal_value_min, estimated_deal_value_max,
          confidence, signals
        ) VALUES (
          ${userId}, ${searchId}, ${p.company_name}, ${p.website || null},
          ${p.location_country || null}, ${p.location_city || null},
          ${p.industry || null}, ${p.employee_count || null},
          ${p.estimated_revenue_min || null}, ${p.estimated_revenue_max || null},
          ${JSON.stringify(p.technology_stack)}, ${JSON.stringify(p.scores)},
          ${p.ai_rating_stars}, ${p.ai_rating_action}, ${p.reasoning || null},
          ${JSON.stringify(p.evidence)}, ${JSON.stringify(p.recommended_services)},
          ${p.estimated_deal_value_min || 0}, ${p.estimated_deal_value_max || 0},
          ${p.confidence || 50}, ${JSON.stringify(p.signals)}
        )
      `;
    }

    // Update search history
    const avgOpp = prospects.length > 0
      ? Math.round(prospects.reduce((s, p) => s + p.scores.opportunity_score, 0) / prospects.length)
      : 0;
    const totalRevenue = prospects.reduce((s, p) => s + (p.estimated_deal_value_max || 0), 0);

    await sql`
      UPDATE search_history
      SET status = 'completed',
          companies_found_count = ${prospects.length},
          average_opportunity_score = ${avgOpp},
          total_potential_revenue = ${totalRevenue}
      WHERE id = ${searchId}
    `;

    return Response.json({
      success: true,
      message: `Found ${prospects.length} companies`,
      data: {
        search_id: searchId,
        prospects,
        insights: {
          total_found: prospects.length,
          average_opportunity: avgOpp,
          total_potential_revenue: totalRevenue,
          average_deal_size: prospects.length > 0
            ? Math.round(totalRevenue / prospects.length)
            : 0,
          industries: [...new Set(prospects.map(p => p.industry).filter(Boolean))],
          best_location: getBestLocation(prospects),
          suggested_campaign: `Target ${prospects.filter(p => p.ai_rating_stars >= 4).length} high-potential companies with personalized outreach`,
        },
      },
    });
  } catch (error) {
    console.error('Discovery error:', error);
    const msg = error instanceof Error ? error.message : 'Discovery failed';
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}

function getBestLocation(prospects: Array<{ location_city: string | null; scores: { opportunity_score: number } }>): string {
  const locationScores: Record<string, number[]> = {};
  for (const p of prospects) {
    const loc = p.location_city || 'Unknown';
    if (!locationScores[loc]) locationScores[loc] = [];
    locationScores[loc].push(p.scores.opportunity_score);
  }
  let best = 'Unknown';
  let bestAvg = 0;
  for (const [loc, scores] of Object.entries(locationScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg > bestAvg) { bestAvg = avg; best = loc; }
  }
  return best;
}

// GET: Search history
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    await initDiscoveryTables();
    const sql = getDb();
    const history = await sql`
      SELECT * FROM search_history WHERE user_id = ${userId} ORDER BY search_date DESC LIMIT 20
    `;
    return Response.json({ success: true, data: history });
  } catch (error) {
    console.error('History error:', error);
    return Response.json({ success: false, message: 'Failed to load history' }, { status: 500 });
  }
}

// DELETE: Remove search history entry
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ success: false, message: 'Search ID required' }, { status: 422 });
    }

    await initDiscoveryTables();
    const sql = getDb();

    // Delete prospect results first (foreign key), then search history
    await sql`DELETE FROM prospect_results WHERE search_id = ${id} AND user_id = ${userId}`;
    await sql`DELETE FROM search_history WHERE id = ${id} AND user_id = ${userId}`;

    return Response.json({ success: true, message: 'Search deleted' });
  } catch (error) {
    console.error('Delete search error:', error);
    return Response.json({ success: false, message: 'Failed to delete' }, { status: 500 });
  }
}
