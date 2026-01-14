export async function callOpenAI(params) {
    const key = process.env.OPENAI_API_KEY;
    if (!key)
        throw new Error("Missing OPENAI_API_KEY");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o",
            max_tokens: params.maxTokens,
            messages: [
                { role: "system", content: params.system },
                { role: "user", content: params.user },
            ],
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenAI API error ${res.status}: ${text}`);
    }
    const json = (await res.json());
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text)
        throw new Error("Empty response from OpenAI");
    return text;
}
