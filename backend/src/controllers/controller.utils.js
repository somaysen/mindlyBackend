export function getAuthId(req) {
  return req.user?.id ?? req.user?._id ?? req.auth?.id ?? req.auth?._id ?? null;
}

export function requireAuthId(req, res) {
  const authId = getAuthId(req);
  if (!authId) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return null;
  }
  return authId;
}

export function sendResult(res, data, status = 200) {
  if (data == null) {
    return res.status(404).json({ success: false, message: "Resource not found." });
  }
  return res.status(status).json({ success: true, data });
}
