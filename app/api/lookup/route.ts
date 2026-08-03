import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface BusinessMatch {
  name: string;
  domain: string;
  country: string;
  flag: string;
  source: string;
}

// ── Multi-Region & Ghana Business Directory ──────────────────────────────────
const CURATED_DIRECTORY: Array<{ name: string; keywords: string[]; domain: string; country: string; flag: string }> = [
  // Banks - Multi-Country
  { name: 'Ecobank Ghana', keywords: ['ecobank', 'eco bank', 'ecobank ghana'], domain: 'ecobank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ecobank Nigeria', keywords: ['ecobank', 'eco bank', 'ecobank nigeria'], domain: 'ecobank.com', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Ecobank Group (Global)', keywords: ['ecobank', 'eco bank', 'ecobank group', 'ecobank global'], domain: 'ecobank.com', country: 'Global / Group', flag: '🌍' },
  { name: 'Standard Chartered Ghana', keywords: ['standard chartered', 'stanchart', 'sc ghana'], domain: 'sc.com/gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Standard Chartered Nigeria', keywords: ['standard chartered', 'stanchart', 'sc nigeria'], domain: 'sc.com/ng', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Standard Chartered Global', keywords: ['standard chartered', 'stanchart'], domain: 'sc.com', country: 'Global', flag: '🌍' },
  { name: 'Stanbic Bank Ghana', keywords: ['stanbic', 'stanbic bank', 'stanbic ghana'], domain: 'stanbicbank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Stanbic IBTC Nigeria', keywords: ['stanbic', 'stanbic nigeria', 'stanbic ibtc'], domain: 'stanbicibtcbank.com', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Standard Bank Group', keywords: ['stanbic', 'standard bank'], domain: 'standardbank.co.za', country: 'South Africa / Global', flag: '🇿🇦' },
  { name: 'Absa Bank Ghana', keywords: ['absa', 'absa bank', 'absa ghana', 'barclays ghana'], domain: 'absa.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Absa Bank Kenya', keywords: ['absa', 'absa kenya'], domain: 'absabank.co.ke', country: 'Kenya', flag: '🇰🇪' },
  { name: 'Absa Group South Africa', keywords: ['absa', 'absa group', 'absa south africa'], domain: 'absa.co.za', country: 'South Africa / Global', flag: '🇿🇦' },
  { name: 'Zenith Bank Ghana', keywords: ['zenith bank', 'zenith', 'zenith ghana'], domain: 'zenithbank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Zenith Bank Nigeria', keywords: ['zenith bank', 'zenith', 'zenith nigeria'], domain: 'zenithbank.com', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'UBA Ghana', keywords: ['uba', 'united bank for africa', 'uba ghana'], domain: 'ubaghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'UBA Group / Nigeria', keywords: ['uba', 'united bank for africa', 'uba nigeria', 'uba group'], domain: 'ubagroup.com', country: 'Nigeria / Global', flag: '🇳🇬' },
  { name: 'Access Bank Ghana', keywords: ['access bank', 'access', 'access ghana'], domain: 'ghana.accessbankplc.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Access Bank Nigeria', keywords: ['access bank', 'access', 'access nigeria'], domain: 'accessbankplc.com', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'GTBank Ghana', keywords: ['gt bank', 'guaranty trust', 'gtb ghana', 'gtbank ghana'], domain: 'gtbank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'GTBank Nigeria / Group', keywords: ['gt bank', 'guaranty trust', 'gtb nigeria', 'gtbank'], domain: 'gtbank.com', country: 'Nigeria / Global', flag: '🇳🇬' },

  // Telcos - Multi-Country
  { name: 'MTN Ghana', keywords: ['mtn ghana', 'mtn'], domain: 'mtn.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'MTN Nigeria', keywords: ['mtn nigeria', 'mtn'], domain: 'mtn.ng', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'MTN South Africa / Group', keywords: ['mtn', 'mtn group', 'mtn south africa'], domain: 'mtn.co.za', country: 'South Africa / Global', flag: '🇿🇦' },
  { name: 'Telecel Ghana (formerly Vodafone)', keywords: ['telecel', 'vodafone ghana', 'telecel ghana'], domain: 'telecelghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Vodafone Global', keywords: ['vodafone'], domain: 'vodafone.com', country: 'Global', flag: '🌍' },
  { name: 'AirtelTigo Ghana', keywords: ['airteltigo', 'airtel tigo', 'tigo', 'airtel ghana'], domain: 'airteltigo.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Airtel Nigeria / Africa', keywords: ['airtel', 'airtel nigeria', 'airtel africa'], domain: 'airtel.com.ng', country: 'Nigeria / Africa', flag: '🇳🇬' },

  // Retail & Supermarkets - Multi-Country
  { name: 'Shoprite Ghana', keywords: ['shoprite', 'shoprite ghana'], domain: 'shoprite.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Shoprite Nigeria', keywords: ['shoprite', 'shoprite nigeria'], domain: 'shoprite.com.ng', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Shoprite South Africa', keywords: ['shoprite', 'shoprite south africa'], domain: 'shoprite.co.za', country: 'South Africa', flag: '🇿🇦' },
  { name: 'Jumia Ghana', keywords: ['jumia', 'jumia ghana'], domain: 'jumia.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Jumia Nigeria', keywords: ['jumia', 'jumia nigeria'], domain: 'jumia.com.ng', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Jumia Kenya', keywords: ['jumia', 'jumia kenya'], domain: 'jumia.co.ke', country: 'Kenya', flag: '🇰🇪' },
  { name: 'Bolt Ghana', keywords: ['bolt', 'bolt ghana'], domain: 'bolt.eu/en-gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Bolt Nigeria', keywords: ['bolt', 'bolt nigeria'], domain: 'bolt.eu/en-ng', country: 'Nigeria', flag: '🇳🇬' },
  { name: 'Bolt Global', keywords: ['bolt'], domain: 'bolt.eu', country: 'Global', flag: '🌍' },
  { name: 'Yango Ghana', keywords: ['yango', 'yango ghana'], domain: 'yango.com/en/gh', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Banks
  { name: 'GCB Bank', keywords: ['gcb', 'gcb bank', 'ghana commercial bank'], domain: 'gcbbank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Fidelity Bank Ghana', keywords: ['fidelity bank', 'fidelity'], domain: 'fidelitybank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'CAL Bank', keywords: ['calbank', 'cal bank'], domain: 'calbank.net', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Agricultural Development Bank (ADB)', keywords: ['agricultural development bank', 'adb', 'adb bank'], domain: 'adbghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'National Investment Bank (NIB)', keywords: ['national investment bank', 'nib'], domain: 'nibghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Societe Generale Ghana', keywords: ['societe generale', 'sg ghana'], domain: 'societegenerale.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Republic Bank Ghana', keywords: ['republic bank', 'hfc bank'], domain: 'republicghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Prudential Bank', keywords: ['prudential bank'], domain: 'prudentialbank.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'OmniBSIC Bank', keywords: ['omnibsic', 'omni bsic'], domain: 'omnibsicbank.com', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Insurance
  { name: 'Enterprise Group Ghana', keywords: ['enterprise insurance', 'enterprise group'], domain: 'enterprisegroup.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'GLICO Group', keywords: ['glico', 'glico insurance', 'glico life'], domain: 'glicogroup.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'SIC Insurance', keywords: ['sic insurance', 'sic'], domain: 'sicghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Star Assurance', keywords: ['star assurance', 'star assurance company'], domain: 'starassurance.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Vanguard Assurance', keywords: ['vanguard assurance'], domain: 'vanguardassurance.com', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Retail
  { name: 'Melcom Ghana', keywords: ['melcom', 'melcom ghana'], domain: 'melcomghana.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Game Stores Ghana', keywords: ['game stores', 'game ghana'], domain: 'game.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Palace Mall', keywords: ['palace mall', 'palace supermarket'], domain: 'palacemall.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'MaxMart', keywords: ['maxmart', 'max mart'], domain: 'maxmart.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Koala Supermarket', keywords: ['koala', 'koala supermarket'], domain: 'koala.com.gh', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Energy
  { name: 'GOIL Company', keywords: ['goil', 'goil company'], domain: 'goilcompany.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'TotalEnergies Ghana', keywords: ['total energies', 'total ghana', 'total petroleum'], domain: 'totalenergies.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Shell Ghana / Vivo Energy', keywords: ['shell ghana', 'shell'], domain: 'shell.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ghana National Petroleum (GNPC)', keywords: ['ghana national petroleum', 'gnpc'], domain: 'gnpc.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Volta River Authority (VRA)', keywords: ['volta river authority', 'vra'], domain: 'vra.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'GRIDCo Ghana', keywords: ['ghana grid company', 'gridco'], domain: 'gridcogh.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Electricity Company of Ghana (ECG)', keywords: ['electricity company ghana', 'ecg'], domain: 'ecgonline.info', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Healthcare
  { name: 'Korle Bu Teaching Hospital', keywords: ['korle bu', 'korle bu teaching hospital'], domain: 'kbth.gov.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Global Med Ghana', keywords: ['global med', 'global med ghana'], domain: 'globalmedgh.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Greater Accra Regional Hospital (Ridge)', keywords: ['greater accra regional hospital', 'ridge hospital'], domain: 'garh.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'The PolyClinic', keywords: ['poly clinic', 'polyclinic ghana'], domain: 'polyclinic.com.gh', country: 'Ghana', flag: '🇬🇭' },

  // Local Ghana Media
  { name: 'Joy FM / MyJoyOnline', keywords: ['joy fm', 'joy news', 'myjoy online', 'multimedia ghana'], domain: 'myjoyonline.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Daily Graphic', keywords: ['graphic', 'daily graphic', 'graphic online'], domain: 'graphic.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'GhanaWeb', keywords: ['ghanaweb'], domain: 'ghanaweb.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'GHOne TV', keywords: ['ghone', 'ghone tv'], domain: 'ghone.tv', country: 'Ghana', flag: '🇬🇭' },
  { name: 'TV3 Ghana / 3News', keywords: ['tv3 ghana', 'tv3', '3news'], domain: '3news.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Peace FM Online', keywords: ['peace fm', 'peace fm ghana'], domain: 'peacefmonline.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Citi FM / CitiNewsroom', keywords: ['citifm', 'citi fm', 'citinewsroom'], domain: 'citinewsroom.com', country: 'Ghana', flag: '🇬🇭' },

  // Government & Institutions
  { name: 'Bank of Ghana (BoG)', keywords: ['bank of ghana', 'bog'], domain: 'bog.gov.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ghana Revenue Authority (GRA)', keywords: ['ghana revenue authority', 'gra'], domain: 'gra.gov.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ghana Immigration Service', keywords: ['ghana immigration'], domain: 'ghanaimmigration.org', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ghana Ports and Harbours (GPHA)', keywords: ['ghana ports', 'gpha', 'ghana ports and harbours'], domain: 'ghanaports.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ghana Airports (GACL)', keywords: ['ghana airports', 'gacl'], domain: 'ghanaairports.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'National Communications Authority (NCA)', keywords: ['national communications authority', 'nca ghana'], domain: 'nca.org.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Securities and Exchange Commission (SEC)', keywords: ['securities and exchange commission', 'sec ghana'], domain: 'sec.gov.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'University of Ghana (Legon)', keywords: ['university of ghana', 'legon', 'ug legon'], domain: 'ug.edu.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'KNUST', keywords: ['knust', 'kwame nkrumah university'], domain: 'knust.edu.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Ashesi University', keywords: ['ashesi university', 'ashesi'], domain: 'ashesi.edu.gh', country: 'Ghana', flag: '🇬🇭' },

  // Real Estate & Logistics
  { name: 'DHL Ghana', keywords: ['dhl ghana', 'dhl'], domain: 'dhl.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'FedEx Ghana', keywords: ['fedex ghana', 'fedex'], domain: 'fedex.com/en-gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Devtraco Ghana', keywords: ['devtraco', 'devtraco ghana'], domain: 'devtraco.com.gh', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Trasacco Group', keywords: ['trasacco', 'trasacco group'], domain: 'trasaccogroup.com', country: 'Ghana', flag: '🇬🇭' },
  { name: 'Regimanuel Gray', keywords: ['regimanuel gray', 'regimanuel'], domain: 'regimanuelgray.com', country: 'Ghana', flag: '🇬🇭' },
];

const IGNORED_DOMAINS = [
  'facebook.com', 'linkedin.com', 'instagram.com', 'twitter.com', 'x.com',
  'youtube.com', 'wikipedia.org', 'play.google.com', 'apps.apple.com',
  'reddit.com', 'tiktok.com', 'pinterest.com', 'google.com', 'yahoo.com',
  'bing.com', 'duckduckgo.com', 'amazon.com', 'yellowpages.com', 'nairaland.com'
];

function isIgnoredDomain(domain: string): boolean {
  if (!domain) return true;
  const d = domain.toLowerCase();
  return IGNORED_DOMAINS.some(ign => d === ign || d.endsWith('.' + ign));
}

function inferFlagAndCountry(domain: string, text: string = ''): { flag: string; country: string } {
  const d = domain.toLowerCase();
  const t = text.toLowerCase();

  if (d.endsWith('.gh') || d.includes('.com.gh') || d.includes('/gh') || t.includes('ghana')) return { flag: '🇬🇭', country: 'Ghana' };
  if (d.endsWith('.ng') || d.includes('.com.ng') || d.includes('/ng') || t.includes('nigeria')) return { flag: '🇳🇬', country: 'Nigeria' };
  if (d.endsWith('.za') || d.includes('.co.za') || t.includes('south africa') || t.includes('rsa')) return { flag: '🇿🇦', country: 'South Africa' };
  if (d.endsWith('.ke') || d.includes('.co.ke') || t.includes('kenya')) return { flag: '🇰🇪', country: 'Kenya' };
  if (d.endsWith('.ci') || t.includes("côte d'ivoire") || t.includes('ivory coast')) return { flag: '🇨🇮', country: "Côte d'Ivoire" };
  if (d.endsWith('.ug') || d.includes('.co.ug') || t.includes('uganda')) return { flag: '🇺🇬', country: 'Uganda' };
  if (d.endsWith('.tz') || d.includes('.co.tz') || t.includes('tanzania')) return { flag: '🇹🇿', country: 'Tanzania' };
  if (d.endsWith('.rw') || t.includes('rwanda')) return { flag: '🇷🇼', country: 'Rwanda' };
  if (d.endsWith('.sn') || t.includes('senegal')) return { flag: '🇸🇳', country: 'Senegal' };
  if (d.endsWith('.cm') || t.includes('cameroon')) return { flag: '🇨🇲', country: 'Cameroon' };
  if (d.endsWith('.eg') || t.includes('egypt')) return { flag: '🇪🇬', country: 'Egypt' };
  if (d.endsWith('.uk') || d.includes('.co.uk') || t.includes('united kingdom') || t.includes(' uk')) return { flag: '🇬🇧', country: 'United Kingdom' };
  if (d.endsWith('.us') || d.endsWith('.gov') || t.includes('united states') || t.includes(' usa')) return { flag: '🇺🇸', country: 'United States' };
  if (d.endsWith('.ca') || t.includes('canada')) return { flag: '🇨🇦', country: 'Canada' };
  if (d.endsWith('.au') || t.includes('australia')) return { flag: '🇦🇺', country: 'Australia' };
  if (d.endsWith('.in') || t.includes('india')) return { flag: '🇮🇳', country: 'India' };
  if (d.endsWith('.ae') || t.includes('dubai') || t.includes('uae')) return { flag: '🇦🇪', country: 'United Arab Emirates' };
  
  return { flag: '🌍', country: 'Global / Group' };
}

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

    const cleanQuery = query.trim().toLowerCase();
    const matches: BusinessMatch[] = [];
    const seenDomains = new Set<string>();

    // 1️⃣ Find ALL matching curated entries across Ghana, Nigeria, Africa, & Global
    for (const entry of CURATED_DIRECTORY) {
      if (entry.keywords.some(kw => cleanQuery.includes(kw) || kw.includes(cleanQuery))) {
        if (!seenDomains.has(entry.domain)) {
          seenDomains.add(entry.domain);
          matches.push({
            name: entry.name,
            domain: entry.domain,
            country: entry.country,
            flag: entry.flag,
            source: 'curated-directory',
          });
        }
      }
    }

    // 2️⃣ Query Google Custom Search API (CSE) for live regional & global website matches
    const googleApiKey = process.env.GOOGLE_CSE_KEY;
    const googleCx = process.env.GOOGLE_CSE_CX;
    if (googleApiKey && googleCx && googleApiKey !== 'your_google_api_key_here' && googleCx !== 'your_search_engine_id_here') {
      try {
        const cseUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(query + ' official website')}`;
        const cseRes = await fetch(cseUrl, { headers: { 'User-Agent': 'ScanVault-Business-Lookup/1.0' } });
        if (cseRes.ok) {
          const cseData = await cseRes.json();
          if (Array.isArray(cseData.items)) {
            for (const item of cseData.items.slice(0, 8)) {
              if (item.link) {
                const domain = extractDomain(item.link);
                if (domain && !isIgnoredDomain(domain) && !seenDomains.has(domain)) {
                  seenDomains.add(domain);
                  const title = item.title || '';
                  const snippet = item.snippet || '';
                  const { flag, country } = inferFlagAndCountry(domain, `${title} ${snippet}`);
                  
                  // Clean up title to use as friendly business name
                  let cleanName = title.replace(/\s*[\-\|]\s*(Home|Official Website|Welcome|Personal.*|Business.*|Online.*).*$/i, '').trim();
                  if (!cleanName || cleanName.length < 2) cleanName = `${query} (${country})`;

                  matches.push({
                    name: cleanName,
                    domain: domain,
                    country: country,
                    flag: flag,
                    source: 'google-cse',
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        // Continue to Clearbit / fallback if CSE fails or errors
      }
    }

    // 3️⃣ Query Clearbit Autocomplete API for additional global / regional suggestions
    try {
      const cbRes = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(cleanQuery)}`, {
        headers: { 'User-Agent': 'ScanVault-Business-Lookup/1.0' },
      });
      if (cbRes.ok) {
        const cbData = await cbRes.json();
        if (Array.isArray(cbData) && cbData.length > 0) {
          for (const item of cbData.slice(0, 5)) {
            if (item.domain && !isIgnoredDomain(item.domain) && !seenDomains.has(item.domain)) {
              seenDomains.add(item.domain);
              const { flag, country } = inferFlagAndCountry(item.domain, item.name || cleanQuery);
              matches.push({
                name: item.name || cleanQuery,
                domain: item.domain,
                country: country,
                flag: flag,
                source: 'clearbit',
              });
            }
          }
        }
      }
    } catch (e) {
      // Continue to web search if Clearbit fails
    }

    // 4️⃣ If still 0 matches, fallback to live DuckDuckGo HTML Search
    if (matches.length === 0) {
      try {
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery + ' official website')}`;
        const ddgRes = await fetch(ddgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (ddgRes.ok) {
          const html = await ddgRes.text();
          const urlMatches = html.match(/class="result__url"\s*[^>]*>\s*([^<\s]+)/gi);
          if (urlMatches && urlMatches.length > 0) {
            for (const match of urlMatches.slice(0, 4)) {
              const rawUrl = match.replace(/.*>\s*/, '').trim();
              const domain = extractDomain(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
              if (domain && !isIgnoredDomain(domain) && !seenDomains.has(domain)) {
                seenDomains.add(domain);
                const { flag, country } = inferFlagAndCountry(domain, cleanQuery);
                matches.push({
                  name: `${cleanQuery} (${domain})`,
                  domain,
                  country,
                  flag,
                  source: 'web-search',
                });
              }
            }
          }
        }
      } catch (e) {
        // Ignore search errors
      }
    }

    // 5️⃣ Return results or 404
    if (matches.length > 0) {
      // Return both top domain for compatibility AND the full matches array
      return NextResponse.json({
        domain: matches[0].domain,
        matches: matches,
        source: matches[0].source,
      });
    }

    return NextResponse.json(
      { error: `"${query}" could not be found automatically. Please enter their website domain directly (e.g. example.com).` },
      { status: 404 }
    );

  } catch (err: any) {
    console.error('Lookup error:', err);
    return NextResponse.json(
      { error: 'Lookup failed. Please enter the domain directly (e.g. example.com).' },
      { status: 500 }
    );
  }
}

