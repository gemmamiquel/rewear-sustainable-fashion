// Vercel serverless function: /api/generate
// Add POLLINATIONS_API_KEY in Vercel Environment Variables. Never put it in frontend code.
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Method not allowed." }); }
  const apiKey = process.env.POLLINATIONS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Image generator not configured. Add POLLINATIONS_API_KEY in Vercel Environment Variables." });
  try {
    const { items, mood } = req.body || {};
    if (!Array.isArray(items) || items.length < 1 || items.length > 8) return res.status(400).json({ error: "Select between 1 and 8 clothing items." });
    const garments = items.map(item => { const name=String(item?.name||"").trim().slice(0,100); const category=String(item?.category||"").trim().slice(0,40); if(!name) throw new Error("A selected clothing item has no name."); return `${name} (${category||"clothing"})`; });
    const moods=["off-duty effortless, relaxed and understated","art-school energy, creative and experimental","quietly polished, refined and minimal"];
    const safeMood=moods.includes(mood)?mood:moods[0];
    const prompt=["Create a high-end realistic fashion editorial photograph.","Show one adult female fashion model, full body, standing naturally in a clean studio.","The model must be wearing these specific clothing items:",garments.map((g,i)=>`${i+1}. ${g}`).join("; "),`Overall styling mood: ${safeMood}.","Build a coherent outfit using the listed garments. Do not replace them with unrelated garments.","Make each described item clearly visible. Contemporary wearable styling, realistic fabric texture, neutral editorial studio background, natural fashion photography lighting, premium magazine photography.","No text, no logos, no collage, no extra people."].join(" ");
    const url="https://gen.pollinations.ai/image/"+encodeURIComponent(prompt)+"?model=black-forest-labs/flux.1-schnell&width=768&height=1024&nologo=true";
    const result=await fetch(url,{headers:{Authorization:`Bearer ${apiKey}`}});
    if(!result.ok){const detail=await result.text().catch(()=>"");console.error("Pollinations",result.status,detail.slice(0,400));return res.status(502).json({error:(result.status===401||result.status===403)?"Pollinations rejected the API key. Check the key saved in Vercel.":"The image service is unavailable or the free balance may have run out. Try again later."});}
    const bytes=Buffer.from(await result.arrayBuffer());res.setHeader("Content-Type",result.headers.get("content-type")||"image/jpeg");res.setHeader("Cache-Control","no-store");return res.status(200).send(bytes);
  } catch(error){console.error(error);return res.status(400).json({error:error.message||"Could not generate this outfit."});}
}
