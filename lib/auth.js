/**
 * Optional access control for the API endpoints.
 *
 * Set the ACCESS_TOKEN environment variable on your deployment to require a
 * matching `token` query parameter on /api/clash and /api/preview-template.
 * When unset (the default), the API stays open — zero-config deploys keep working.
 */
export function checkAccessToken(req) {
  const required = process.env.ACCESS_TOKEN
  if (!required) return true
  return req.query.token === required
}
