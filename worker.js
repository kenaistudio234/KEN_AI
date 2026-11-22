
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST." }, 405);
      }

      if (!env.AI) {
        return json({ error: "AI engine is not connected yet." }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid message." }, 400);
      }

      const question = typeof body.question === "string"
        ? body.question.trim()
        : "";

      if (!question) {
        return json({ error: "Please type a question." }, 400);
      }

      if (question.length > 4000) {
        return json({ error: "Message is too long." }, 413);
      }

      try {
        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              {
                role: "system",
                content: "You are KEN AI, a helpful and intelligent assistant. Give clear, useful and respectful answers."
              },
              {
                role: "user",
                content: question
              }
            ]
          }
        );

        return json({ answer: result.response });
      } catch {
        return json({
          error: "KEN AI is temporarily unavailable. Try again."
        }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
