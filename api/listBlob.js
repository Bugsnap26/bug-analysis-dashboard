// api/listBlob.js
import { list } from "@vercel/blob";

export default async function handler(req, res) {
  try {
    // Fetch all blobs from your Vercel Blob storage
    const { blobs } = await list();

    res.status(200).json(blobs);
  } catch (error) {
    console.error("Error fetching blobs:", error);
    res.status(500).json({ error: "Failed to fetch blobs" });
  }
}
