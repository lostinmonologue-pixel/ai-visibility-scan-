exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const WIX_API_KEY = process.env.WIX_API_KEY;
  const WIX_SITE_ID = process.env.WIX_SITE_ID;

  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing Wix credentials' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const { email, brand, url, category, score } = body;

  try {
    const response = await fetch('https://www.wixapis.com/contacts/v4/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID
      },
      body: JSON.stringify({
        info: {
          emails: {
            items: [{ tag: 'MAIN', email }]
          },
          extendedFields: {
            items: {
              'custom.scan-brand': brand || '',
              'custom.scan-url': url || '',
              'custom.scan-category': category || '',
              'custom.scan-score': score ? String(score) : '0',
              'custom.lead-source': 'AI Visibility Scan'
            }
          }
        }
      })
    });

    // 200 = created, 409 = contact already exists — both are fine
    if (!response.ok && response.status !== 409) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Wix API error ${response.status}`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
