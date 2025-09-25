export default async function handler(request, response) {
  try {
    const { path = [] } = request.query;
    const upstreamPath = Array.isArray(path) ? path.join('/') : String(path || '');

    const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || '';
    if (!TMDB_API_KEY) {
      return response.status(500).json({ error: 'Missing TMDB API key on server' });
    }

    const upstreamUrl = new URL(`https://api.themoviedb.org/3/${upstreamPath}`);

    // Copy query params and add api_key
    const originalUrl = new URL(request.url, `http://${request.headers.host}`);
    originalUrl.searchParams.forEach((value, key) => {
      // Do not forward any client-provided api_key
      if (key.toLowerCase() !== 'api_key') upstreamUrl.searchParams.set(key, value);
    });
    upstreamUrl.searchParams.set('api_key', TMDB_API_KEY);

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const contentType = upstreamRes.headers.get('content-type') || '';
    const status = upstreamRes.status;

    if (contentType.includes('application/json')) {
      const data = await upstreamRes.json();
      return response.status(status).json(data);
    } else {
      const buffer = await upstreamRes.arrayBuffer();
      response.status(status);
      response.setHeader('Content-Type', contentType || 'application/octet-stream');
      return response.send(Buffer.from(buffer));
    }
  } catch (error) {
    return response.status(500).json({ error: 'Proxy error', details: String((error && error.message) || error) });
  }
}


