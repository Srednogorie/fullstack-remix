// Alternatively robots.txt can be placed ini the public folder
// This iis more appropriate for dynamic assets creation
const textContent = `User-agent: *
Disallow: /dashboard/
Allow: /login
Allow: /signup
Allow: /$
`;
export function loader() {
    // Any kind of response can be returned by the loader
    return new Response(textContent, { headers: { 'Content-Type': 'text/plain' } });
}