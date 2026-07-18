import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ── Curated Ghana Business Directory ─────────────────────────────────────────
// Matched by fuzzy keyword search before hitting any external API
const GHANA_DIRECTORY: Array<{ keywords: string[]; domain: string }> = [
  // Banks
  { keywords: ['ecobank', 'eco bank'], domain: 'ecobank.com' },
  { keywords: ['gcb', 'gcb bank', 'ghana commercial bank'], domain: 'gcbbank.com.gh' },
  { keywords: ['stanbic', 'stanbic bank'], domain: 'stanbicbank.com.gh' },
  { keywords: ['absa', 'absa bank', 'barclays ghana'], domain: 'absa.com.gh' },
  { keywords: ['standard chartered', 'standard chartered bank'], domain: 'sc.com/gh' },
  { keywords: ['fidelity bank', 'fidelity'], domain: 'fidelitybank.com.gh' },
  { keywords: ['zenith bank', 'zenith'], domain: 'zenithbank.com.gh' },
  { keywords: ['uba', 'united bank for africa'], domain: 'ubaghana.com' },
  { keywords: ['access bank', 'access'], domain: 'ghana.accessbankplc.com' },
  { keywords: ['calbank', 'cal bank'], domain: 'calbank.net' },
  { keywords: ['agricultural development bank', 'adb', 'adb bank'], domain: 'adbghana.com' },
  { keywords: ['national investment bank', 'nib'], domain: 'nibghana.com' },
  { keywords: ['societe generale', 'sg ghana'], domain: 'societegenerale.com.gh' },
  { keywords: ['republic bank', 'hfc bank'], domain: 'republicghana.com' },
  { keywords: ['prudential bank'], domain: 'prudentialbank.com.gh' },
  { keywords: ['omnibsic', 'omni bsic'], domain: 'omnibsicbank.com' },
  { keywords: ['gt bank', 'guaranty trust', 'gtb ghana'], domain: 'gtbank.com.gh' },
  // Telcos
  { keywords: ['mtn ghana', 'mtn'], domain: 'mtn.com.gh' },
  { keywords: ['vodafone ghana', 'vodafone'], domain: 'vodafone.com.gh' },
  { keywords: ['airteltigo', 'airtel tigo', 'tigo', 'airtel ghana'], domain: 'airteltigo.com.gh' },
  { keywords: ['telecel ghana', 'telecel'], domain: 'telecelghana.com' },
  // Insurance
  { keywords: ['enterprise insurance', 'enterprise group'], domain: 'enterprisegroup.com.gh' },
  { keywords: ['glico', 'glico insurance', 'glico life'], domain: 'glicogroup.com' },
  { keywords: ['sic insurance', 'sic'], domain: 'sicghana.com' },
  { keywords: ['star assurance', 'star assurance company'], domain: 'starassurance.com' },
  { keywords: ['vanguard assurance'], domain: 'vanguardassurance.com' },
  // Retail / Supermarkets
  { keywords: ['melcom', 'melcom ghana'], domain: 'melcomghana.com' },
  { keywords: ['shoprite ghana', 'shoprite'], domain: 'shoprite.com.gh' },
  { keywords: ['game stores', 'game ghana'], domain: 'game.com.gh' },
  { keywords: ['palace mall', 'palace supermarket'], domain: 'palacemall.com.gh' },
  { keywords: ['maxmart', 'max mart'], domain: 'maxmart.com.gh' },
  { keywords: ['koala', 'koala supermarket'], domain: 'koala.com.gh' },
  // Fuel / Energy
  { keywords: ['goil', 'goil company'], domain: 'goilcompany.com' },
  { keywords: ['total energies', 'total ghana', 'total petroleum'], domain: 'totalenergies.com.gh' },
  { keywords: ['shell ghana', 'shell'], domain: 'shell.com.gh' },
  { keywords: ['ghana national petroleum', 'gnpc'], domain: 'gnpc.com.gh' },
  { keywords: ['volta river authority', 'vra'], domain: 'vra.com' },
  { keywords: ['ghana grid company', 'gridco'], domain: 'gridcogh.com' },
  { keywords: ['electricity company ghana', 'ecg'], domain: 'ecgonline.info' },
  // Healthcare
  { keywords: ['korle bu', 'korle bu teaching hospital'], domain: 'kbth.gov.gh' },
  { keywords: ['global med', 'global med ghana'], domain: 'globalmedgh.com' },
  { keywords: ['greater accra regional hospital', 'ridge hospital'], domain: 'garh.com.gh' },
  { keywords: ['poly clinic', 'polyclinic ghana'], domain: 'polyclinic.com.gh' },
  // Media
  { keywords: ['joy fm', 'joy news', 'myjoy online', 'multimedia ghana'], domain: 'myjoyonline.com' },
  { keywords: ['graphic', 'daily graphic', 'graphic online'], domain: 'graphic.com.gh' },
  { keywords: ['ghanaweb'], domain: 'ghanaweb.com' },
  { keywords: ['ghone', 'ghone tv'], domain: 'ghone.tv' },
  { keywords: ['tv3 ghana', 'tv3'], domain: 'tv3ghana.com' },
  { keywords: ['peace fm', 'peace fm ghana'], domain: 'peacefmonline.com' },
  { keywords: ['citifm', 'citi fm', 'citinewsroom'], domain: 'citinewsroom.com' },
  // Government / Regulatory
  { keywords: ['bank of ghana', 'bog'], domain: 'bog.gov.gh' },
  { keywords: ['ghana revenue authority', 'gra'], domain: 'gra.gov.gh' },
  { keywords: ['ghana immigration'], domain: 'ghanaimmigration.org' },
  { keywords: ['ghana ports', 'gpha', 'ghana ports and harbours'], domain: 'ghanaports.com.gh' },
  { keywords: ['ghana airports', 'gacl'], domain: 'ghanaairports.com.gh' },
  { keywords: ['national communications authority', 'nca ghana'], domain: 'nca.org.gh' },
  { keywords: ['securities and exchange commission', 'sec ghana'], domain: 'sec.gov.gh' },
  // Logistics / Transport
  { keywords: ['dhl ghana', 'dhl'], domain: 'dhl.com.gh' },
  { keywords: ['fedex ghana', 'fedex'], domain: 'fedex.com/en-gh' },
  { keywords: ['bolt ghana', 'bolt'], domain: 'bolt.eu/en-gh' },
  { keywords: ['yango ghana', 'yango'], domain: 'yango.com/en/gh' },
  // Education
  { keywords: ['university of ghana', 'legon', 'ug legon'], domain: 'ug.edu.gh' },
  { keywords: ['knust', 'kwame nkrumah university'], domain: 'knust.edu.gh' },
  { keywords: ['ashesi university', 'ashesi'], domain: 'ashesi.edu.gh' },
  { keywords: ['university of cape coast', 'ucc'], domain: 'ucc.edu.gh' },
  { keywords: ['ghana institute of management', 'gimpa'], domain: 'gimpa.edu.gh' },
  // Real Estate / Construction
  { keywords: ['devtraco', 'devtraco ghana'], domain: 'devtraco.com.gh' },
  { keywords: ['trasacco', 'trasacco group'], domain: 'trasaccogroup.com' },
  { keywords: ['regimanuel gray', 'regimanuel'], domain: 'regimanuelgray.com' },
];

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function lookupInDirectory(query: string): string | null {
  const q = query.toLowerCase().trim();
  for (const entry of GHANA_DIRECTORY) {
    if (entry.keywords.some(kw => q.includes(kw) || kw.includes(q))) {
      return entry.domain;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter a business name' }, { status: 400 });
    }

    // 1️⃣ Check curated Ghana directory first (instant, no API needed)
    const directoryDomain = lookupInDirectory(query.trim());
    if (directoryDomain) {
      return NextResponse.json({ domain: directoryDomain, source: 'directory' });
    }

    // 2️⃣ Google Custom Search Engine (if configured)
    const apiKey = process.env.GOOGLE_CSE_KEY;
    const cx = process.env.GOOGLE_CSE_CX;

    if (apiKey && cx && apiKey !== 'your_google_api_key_here') {
      const searchQuery = encodeURIComponent(`${query.trim()} Ghana official website`);
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=5`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const items = data.items as Array<{ link: string; displayLink: string }>;
        // Prefer .gh domains
        const ghResult = items.find(item => item.link.includes('.gh') || item.displayLink.includes('.gh'));
        const best = ghResult || items[0];
        const domain = extractDomain(best.link);
        if (domain) {
          return NextResponse.json({ domain, source: 'google' });
        }
      }

      return NextResponse.json(
        { error: `Could not find a website for "${query}". Try entering the domain directly (e.g. example.com.gh).` },
        { status: 404 }
      );
    }

    // 3️⃣ No Google key configured — prompt user to enter domain directly
    return NextResponse.json(
      { error: `"${query}" is not in our directory yet. Please enter their website domain directly (e.g. example.com.gh).` },
      { status: 404 }
    );

  } catch (err: any) {
    console.error('Lookup error:', err);
    return NextResponse.json(
      { error: 'Lookup failed. Please enter the domain directly (e.g. example.com.gh).' },
      { status: 500 }
    );
  }
}
