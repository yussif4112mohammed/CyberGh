import { Finding } from '@/types/scan';

export async function checkBreach(domain: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
  try {
    const apiKey = process.env.RAPIDAPI_KEY || process.env.BREACH_DIRECTORY_KEY;
    
    if (!apiKey) {
      findings.push({
        category: 'breach',
        severity: 'info',
        title: 'Data breach scan skipped (API Key required)',
        description: 'The data breach scanner is currently disabled because the RapidAPI key is missing in your configuration.',
        fix: 'Create a free account at RapidAPI.com, subscribe to the BreachDirectory API, and add your RAPIDAPI_KEY to your environment variables.',
      });
      return findings;
    }

    const res = await fetch(
      `https://breachdirectory.p.rapidapi.com/passwords?query=${encodeURIComponent(domain)}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'breachdirectory.p.rapidapi.com'
        },
        signal: controller.signal,
      }
    );

    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    
    // BreachDirectory returns { success: true, found: number, result: [...] }
    const count = data.found || 0;

    if (count === 0) {
      findings.push({
        category: 'breach',
        severity: 'pass',
        title: 'No data breaches found for your domain',
        description: 'We checked the BreachDirectory database and found no compromised credentials associated with your domain.',
        fix: '',
      });
    } else {
      const breaches = data.result || [];
      const sources = Array.from(new Set(breaches.map((b: any) => b.sources?.join(', ') || 'Unknown').filter(Boolean)));
      const sourceList = sources.slice(0, 5).join(', ');

      findings.push({
        category: 'breach',
        severity: count > 10 ? 'high' : count > 3 ? 'medium' : 'low',
        title: `${count} breached credential${count === 1 ? '' : 's'} involving your domain`,
        description: `Credentials ending in @${domain} have appeared in ${count} known data breach${count === 1 ? '' : 'es'}. This means staff or customer credentials may be compromised and reused on other platforms.`,
        fix: 'Enforce mandatory password resets for all employee accounts and activate Two-Factor Authentication (2FA) across your organization immediately.',
        evidence: sources.length > 0 ? `Known sources: ${sourceList}` : undefined,
      });
    }
  } catch (err) {
    findings.push({
      category: 'breach',
      severity: 'info',
      title: 'Breach database check skipped',
      description: 'We could not reach the breach database during this scan.',
      fix: 'Check manually at haveibeenpwned.com/domain-search',
    });
  } finally {
    clearTimeout(timeout);
  }

  return findings;
}
