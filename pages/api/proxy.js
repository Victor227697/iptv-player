export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await fetch(decodedUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch content" });
    }

    const content = await response.text();
    res.setHeader("Content-Type", "application/x-mpegURL");
    res.status(200).send(content);
  } catch (error) {
    res.status(500).json({ error: "Proxy error", details: error.message });
  }
}
