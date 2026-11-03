export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length < 2 || items.length > 4) {
      return res.status(400).json({
        error: "Please provide between 2 and 4 wardrobe items."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "The OpenAI API key is not configured in Vercel."
      });
    }

    for (const item of items) {
      if (
        typeof item.name !== "string" ||
        typeof item.category !== "string" ||
        typeof item.color !== "string" ||
        typeof item.image !== "string" ||
        !item.image.startsWith("data:image/")
      ) {
        return res.status(400).json({
          error: "One of the wardrobe items is invalid."
        });
      }
    }

    const itemDescriptions = items.map(item =>
      `${item.name} (${item.category}, ${item.color})`
    ).join("; ");

    const prompt = `
Create a full-length editorial fashion photograph of a stylish person
wearing an outfit inspired by the supplied wardrobe reference images.

The wardrobe pieces are:
${itemDescriptions}.

IMPORTANT:
- Use the supplied images as visual references for the garments.
- Include all the listed wardrobe pieces in one coherent outfit.
- Preserve their main colours, garment types and recognisable design features.
- Do not replace the garments with unrelated clothing.
- Combine the pieces in a stylish, realistic and wearable way.
- The result should look like a professional fashion editorial.
- Show the person from head to toe, with the outfit clearly visible.
- Use a simple warm beige studio background.
- Natural editorial lighting, realistic fabric textures.
- One person only.
- No text, no logos, no watermark.
- Vertical portrait composition.

The result is a creative styling interpretation, not an exact product replica.
`;

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-2.5-sunburst",
        images: items.map(item => ({
          image_url: item.image
        })),
        prompt,
        size: "1024x1536",
        quality: "medium",
        output_format: "jpeg",
        output_compression: 70
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI style remix error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "The outfit could not be generated."
      });
    }

    const image = data.data?.[0]?.b64_json;

    if (!image) {
      return res.status(500).json({
        error: "The AI did not return an outfit image."
      });
    }

    return res.status(200).json({ image });

  } catch (error) {
    console.error("Style remix API error:", error);
    return res.status(500).json({
      error: "Something went wrong while creating your outfit."
    });
  }
}
