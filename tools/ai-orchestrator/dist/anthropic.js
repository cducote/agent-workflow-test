export async function callClaude(params) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key)
        throw new Error("Missing ANTHROPIC_API_KEY");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: params.maxTokens,
            system: params.system,
            messages: [{ role: "user", content: params.user }]
        })
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Anthropic API error ${res.status}: ${text}`);
    }
    const json = (await res.json());
    const text = json.content
        .filter((c) => c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("\n")
        .trim();
    if (!text)
        throw new Error("Empty response from Claude");
    return text;
}
