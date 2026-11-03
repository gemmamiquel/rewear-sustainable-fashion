export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { name, category, color } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof category !== "string" ||
      typeof color !== "string" ||
      !name.trim() ||
      !category.trim() ||
      !color.trim()
    ) {
      return res.status(400).json({ error: "Please provide the item name, category and colour." });
    }

    if (name.length > 80 || category.length > 40 || color.length > 40) {
      return res.status(400).json({ error: "One of the descriptions is too long." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "The OpenAI API key is not configured in Vercel." });
    }

    const prompt = `
Create a high-quality fashion product photograph of ONE garment.

Garment: ${name.trim()}
Category: ${category.trim()}
Main colour: ${color.trim()}

Visual direction:
- Show only the described clothing item.
- The garment should be clearly visible, centred and fully inside the frame.
- Clean editorial fashion product photography.
- Neutral warm beige studio background.
- Soft natural studio lighting.
- Realistic fabric texture, seams, shape and details.
- No person, no mannequin, no hanger, no text, no logo, no watermark.
- Square composition.
- Do not add other garments or accessories.
`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-2.5-sunburst",
        prompt,
        size: "1024x1024",
        quality: "low",
        output_format: "jpeg",
        output_compression: 65
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI image generation error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "The AI image could not be generated."
      });
    }

    const image = data.data?.[0]?.b64_json;

    if (!image) {
      return res.status(500).json({ error: "The AI did not return an image." });
    }

    return res.status(200).json({ image });

  } catch (error) {
    console.error("Garment image API error:", error);
    return res.status(500).json({ error: "Something went wrong while creating the garment image." });
  }
}
