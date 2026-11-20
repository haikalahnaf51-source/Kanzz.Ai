export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/kanzz") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Metode tidak diizinkan." }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
      }

      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(JSON.stringify({ error: "GEMINI_API_KEY belum diatur di Worker." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json();
        const question = body && typeof body.question === "string" ? body.question.trim() : "";

        if (!question) {
          return new Response(JSON.stringify({ error: "Pertanyaan tidak boleh kosong." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
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
          return new Response(JSON.stringify({ error: errMsg }), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
          });
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
          return new Response(JSON.stringify({ error: "Kanzz tidak menerima balasan teks yang valid." }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ reply }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message || "Terjadi kesalahan di server." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
