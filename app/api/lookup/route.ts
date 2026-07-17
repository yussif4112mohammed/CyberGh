import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a business name' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CSE_KEY;
    const cx = process.env.GOOGLE_CSE_CX;

    // If Google CSE is configured, use it
    if (apiKey && cx && apiKey !== 'your_google_api_key_here') {
      const searchQuery = encodeURIComponent(`${query.trim()} Ghana official website`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=5`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        // Find the best result — prefer .gh domains, otherwise take first
        const items = data.items as Array<{ link: string; displayLink: string }>;
        const ghResult = items.find(item => item.link.includes('.gh') || item.displayLink.includes('.gh'));
        const best = ghResult || items[0];
        const domain = extractDomain(best.link);
        
        if (domain) {
          return NextResponse.json({ domain, source: 'google' });
        }
      }
      
      return NextResponse.json({ error: `Could not find a website for "${query}"` }, { status: 404 });
    }

    // Fallback: DuckDuckGo Instant Answer API (no key needed)
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' Ghana')}&format=json&no_html=1`;
    const ddgRes = await fetch(ddgUrl, {
      headers: { 'User-Agent': 'CyberGH-Scanner/1.0' },
    });
    const ddgData = await ddgRes.json();
    
    // Try AbstractURL first (direct entity result)
    if (ddgData.AbstractURL) {
      const domain = extractDomain(ddgData.AbstractURL);
      if (domain) return NextResponse.json({ domain, source: 'duckduckgo' });
    }
    
    // Try OfficialWebsite from Infobox
    if (ddgData.Infobox?.content) {
      const website = ddgData.Infobox.content.find((c: any) => c.label === 'Official website' || c.data_type === 'string' && c.value?.startsWith('http'));
      if (website?.value) {
        const domain = extractDomain(website.value);
        if (domain) return NextResponse.json({ domain, source: 'duckduckgo' });
      }
    }

    return NextResponse.json({ error: `Could not find a website for "${query}". Try entering the domain directly.` }, { status: 404 });
    
  } catch (err: any) {
    console.error('Lookup error:', err);
    return NextResponse.json({ error: 'Lookup failed. Please try entering the domain directly.' }, { status: 500 });
  }
}
