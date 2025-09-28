export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Get the path from the incoming request URL
  const path = new URL(request.url).pathname.replace('/api/', '');
  
  // Get the secret API key from Vercel's environment variables
  const apiKey = process.env.VITE_TMDB_API_KEY;

  // If the key is missing, return an error
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Construct the full URL for the real TMDB API
  const tmdbUrl = new URL(`https://api.themoviedb.org/3/${path}`);
  
  // Add the secret API key and any other parameters from the original request
  tmdbUrl.searchParams.set('api_key', apiKey);
  new URL(request.url).searchParams.forEach((value, key) => {
    tmdbUrl.searchParams.set(key, value);
  });

  // Fetch the data from TMDB and return it directly to your website
  try {
    const res = await fetch(tmdbUrl.toString());
    return new Response(res.body, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('Content-Type') },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'API fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
