export function notFound(_req, res) { res.status(404).json({ success: false, message: 'Route not found' }); }
export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error.message);
  res.status(status).json({ success: false, message: status < 500 ? error.message : 'Unable to complete this request. Please retry.' });
}
