export async function sendContactRequest(email, data, { fetcher = fetch, timeoutMs = 20000 } = {}) {
  if (!['hello@infrayard.eu', 'support@infrayard.eu'].includes(email)) throw new Error('Unknown contact destination');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`https://formsubmit.co/ajax/${email}`, {
      method: 'POST', headers: { Accept: 'application/json' }, body: data, signal: controller.signal,
    });
    if (!response.ok) throw new Error('Contact service rejected the request');
    const result = await response.json();
    if (result.success !== true && result.success !== 'true') throw new Error('Contact service did not confirm acceptance');
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
