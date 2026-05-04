import os
import json
import httpx
from backend.services.personas import select_personas
import re

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/auto"

def build_persona_prompt(persona: dict, stock: dict) -> str:
    return f"""You are a {persona['name']} investor in the style of {persona['style']}.

Your lens: {persona['lens']}
Your focus areas: {persona['focus']}
What you consider good: {persona['good']}
What you consider bad: {persona['bad']}

Analyse this stock and give your recommendation:
- Ticker: {stock['ticker']}
- Current price: ${stock['price']}
- Change today: {stock['change_pct']}
- Recent news: {json.dumps(stock['news'][:3])}

Respond ONLY with a JSON object in this exact format, no other text:
{{
    "recommendation": "buy" or "hold" or "sell",
    "reasoning": "2-3 sentence explanation from your perspective",
    "riskFactors": ["risk 1", "risk 2"],
    "positionSize": "small" or "medium" or "large",
    "confidence": 0.0 to 1.0
}}"""

def run_persona_analysis(persona: dict, stock: dict) -> dict:
    prompt = build_persona_prompt(persona, stock)
    
    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500
            },
            timeout=30.0
        )
        
        content = response.json()["choices"][0]["message"]["content"]
        
        # Strip markdown code blocks if present
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        content = content.strip()

        # Extract JSON
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found in response")
        result = json.loads(json_match.group())
        
        return {
            "personaId": persona["id"],
            "personaName": persona["name"],
            "recommendation": result["recommendation"],
            "reasoning": result["reasoning"],
            "riskFactors": result.get("riskFactors", []),
            "positionSize": result.get("positionSize", "medium"),
            "confidence": float(result.get("confidence", 0.7)),
            "weight": persona["weight"]
        }
    except Exception as e:
        return {
            "personaId": persona["id"],
            "personaName": persona["name"],
            "recommendation": "hold",
            "reasoning": f"Analysis unavailable: {str(e)}",
            "riskFactors": ["Analysis failed"],
            "positionSize": "small",
            "confidence": 0.0,
            "weight": persona["weight"]
        }

def run_chairman(analyses: list) -> dict:
    signal_map = {"buy": 1, "hold": 0, "sell": -1}
    
    weighted_signal = sum(
        signal_map.get(a["recommendation"], 0) * a["weight"]
        for a in analyses
    )
    
    if weighted_signal > 0.2:
        action = "buy"
    elif weighted_signal < -0.2:
        action = "sell"
    else:
        action = "hold"

    avg_confidence = sum(a["confidence"] * a["weight"] for a in analyses)

    if abs(weighted_signal) > 0.6:
        position_size = "large"
    elif abs(weighted_signal) > 0.3:
        position_size = "medium"
    else:
        position_size = "small"

    buy_count = sum(1 for a in analyses if a["recommendation"] == "buy")
    sell_count = sum(1 for a in analyses if a["recommendation"] == "sell")
    hold_count = sum(1 for a in analyses if a["recommendation"] == "hold")

    summary = f"{buy_count} advisor(s) recommend buy, {hold_count} hold, {sell_count} sell. "
    summary += f"Weighted signal: {'bullish' if weighted_signal > 0 else 'bearish' if weighted_signal < 0 else 'neutral'}."

    return {
        "action": action,
        "positionSize": position_size,
        "summary": summary,
        "confidence": round(avg_confidence, 3),
        "personaContributions": analyses
    }

def run_council(profile: dict, stock: dict) -> dict:
    personas = select_personas(profile)
    analyses = [run_persona_analysis(p, stock) for p in personas]
    return run_chairman(analyses)