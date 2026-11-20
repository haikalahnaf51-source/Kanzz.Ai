export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY belum diatur di server." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const question = body && typeof body.question === "string" ? body.question.trim() : "";

    if (!question) {
      return res.status(400).json({ error: "Pertanyaan tidak boleh kosong." });
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "Nama kamu adalah Kanzz. Jawablah pertanyaan pengguna dengan jelas, tenang, terstruktur, dan membantu dalam bahasa Indonesia."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: question }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data && data.error && data.error.message
          ? data.error.message
          : "Gagal menghubungi Gemini API.";
      return res.status(response.status).json({ error: errMsg });
    }

    const reply =
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
        ? data.candidates[0].content.parts[0].text
        : "";

    if (!reply) {
      return res.status(500).json({ error: "Kanzz tidak menerima balasan teks yang valid." });
    }

    return res.status(200).json({ reply: reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Terjadi kesalahan di server." });
  }
}
