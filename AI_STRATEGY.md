# BeehiveDrive — AI Integration Strategy

## The Golden Rule
Pre-generate what needs accuracy. Real-time what needs personalization.

## AI Features by Priority

### MVP (Launch)
| Feature | Model | Approach | Cost |
|---------|-------|----------|------|
| 500+ question generation from handbook | Sonnet | Pre-generated, human-verified, stored in DB | ~$1-2 one-time |
| Wrong-answer explanations | Sonnet | Pre-generated with questions, stored in DB | Included above |
| Question variations (expand bank) | Haiku | Pre-generated in batches, verified | ~$0.30-0.50 one-time |
| Readiness prediction | None (local algorithm) | Weighted formula by topic, decay, confidence | $0 |

### V1.1 (Weeks 5-8)
| Feature | Model | Approach | Cost |
|---------|-------|----------|------|
| "Ask BeehiveDrive" chatbot | Haiku + RAG | Real-time with handbook embeddings + FAQ cache | ~$0.002/question |
| Personalized mnemonics | Haiku | Real-time, triggered after 2+ wrong on same number | ~$0.001/generation |
| AI study plans | Haiku | After diagnostic quiz, template + AI fill | ~$0.003/plan |
| Branching scenarios | Sonnet | Pre-generated, 20-30 scenarios, stored as JSON | ~$0.50-1.00 one-time |

### V2+ (Nice-to-Have)
| Feature | Model | Approach | Cost |
|---------|-------|----------|------|
| Readiness narrative | Haiku | AI-generated "you're ready because..." message | ~$0.002/call |
| Personalized re-explanations | Haiku | Triggered after 3+ wrong on same question | ~$0.002/call |
| Socratic tutoring mode | Haiku | Chatbot asks guiding questions instead of answering | ~$0.002/exchange |

### Skip
- Real-time difficulty adjustment per question (local algorithm sufficient)
- AI-generated images or diagrams
- Voice-based AI tutor
- Multi-state expansion before proving Utah market

---

## One-Time Setup Costs

| Item | Model | Cost |
|------|-------|------|
| 500 base questions from handbook | Sonnet | $1.00-2.00 |
| 500 question variations | Haiku | $0.30-0.50 |
| 30 branching scenarios | Sonnet | $0.50-1.00 |
| Handbook embedding for RAG | OpenAI text-embedding-3-small | $0.01 |
| Content QA review pass | Sonnet | $0.50-1.00 |
| **Total one-time** | | **~$3-5** |

## Monthly Recurring Costs

| Monthly Active Users | AI API Cost | Supabase | Vercel | Total |
|---------------------|-------------|----------|--------|-------|
| 100 | $10-20 | $0 | $0 | $10-20 |
| 1,000 | $80-150 | $0-25 | $0-20 | $80-195 |
| 10,000 | $600-1,200 | $25-75 | $20-50 | $645-1,325 |

At 10,000 users paying $4.99/month = $50K/month revenue. AI costs = 2.5-6% of revenue.

---

## "Ask BeehiveDrive" Chatbot Architecture

### RAG Pipeline (Retrieval-Augmented Generation)
1. Chunk Utah Driver Handbook into ~100 paragraphs
2. Generate embeddings via OpenAI text-embedding-3-small (cost: $0.01 total)
3. Store in Supabase pgvector
4. On user question: retrieve 3 most relevant handbook chunks
5. Include chunks as context in Claude prompt
6. Return answer grounded in source material

### Safety Layers
1. **RAG** — answers from handbook, not training data
2. **FAQ cache** — pre-approved answers for top 50 questions (no API call needed)
3. **Semantic caching** — similar questions return cached answers (40-60% hit rate)
4. **Confidence gating** — AI rates its own confidence; low confidence = show disclaimer
5. **Scope enforcement** — system prompt restricts to Utah driving topics only
6. **User reporting** — "Flag this answer" button, review weekly

### System Prompt
```
You are BeehiveDrive's Utah driving law assistant. You ONLY answer questions about:
1. Utah driving laws and regulations
2. The Utah driver license written test
3. Study tips for the driving test
4. Utah-specific driving rules

STRICT RULES:
- ONLY cite information from the provided Utah Driver Handbook sections
- If uncertain, say: "I'd recommend checking the Utah Driver Handbook Section [X] or dld.utah.gov"
- NEVER answer questions unrelated to driving/the test
- NEVER give legal advice. Add: "This is for test prep only, not legal advice."
- Keep answers under 150 words
- If asked about other states: "I only cover Utah driving laws."
```

### Rate Limiting
- Free tier: 5 AI tutor questions per day
- Premium ($4.99/month or $9.99 one-time): Unlimited AI tutor + study plans + mnemonics

### Cost Reduction Pipeline
```
User question
  → Check exact FAQ match (free, instant)
  → Check semantic cache similarity > 0.92 (cheap embedding call)
  → If no cache hit: RAG retrieval + Haiku generation + cache result
```
Expected cache hit rate after 1,000 users: 40-60%.

---

## Question Generation Prompt Template

```
System: "You are a driving test question writer for the Utah Driver License exam.
You create questions that match the style, difficulty, and format of the actual
Utah DLD written test. Questions must be factually accurate based ONLY on the
provided handbook text. Never invent laws or rules not in the source material."

User: "Based on this section of the Utah Driver Handbook:

---
{handbook_section_text}
---

Generate 10 multiple-choice questions with 4 answer options each.

Requirements:
- Mix difficulty: 3 easy (direct recall), 4 medium (application), 3 hard (scenario)
- Every correct answer must be directly supported by the text above
- Wrong answers should be plausible but clearly wrong per the handbook
- Include specific handbook reference for each correct answer
- Format as JSON:
{
  'questions': [{
    'question': '',
    'options': ['A', 'B', 'C', 'D'],
    'correct': 0,
    'difficulty': 1-5,
    'topic': '',
    'handbook_reference': 'Section X, Page Y',
    'explanation': 'why the correct answer is correct',
    'wrong_explanations': {
      'A': 'why A is wrong',
      'B': 'why B is wrong',
      ...
    }
  }]
}"
```

---

## Privacy & Safety (Teen Users)

### Data Sanitization Before AI Calls
```javascript
function sanitizeForAI(userData) {
  return {
    age_bracket: userData.age < 18 ? 'teen' : 'adult',
    performance_summary: userData.topicScores,
    question: userData.currentQuestion,
    // NEVER include: name, email, phone, location, school
  };
}
```

### Requirements
- Strip all PII before Claude API calls
- Supabase RLS ensures users only see own data
- Privacy policy addresses: AI usage, third-party API data, data retention
- Parental consent checkbox for under-18
- Delete AI conversation history after 30 days
- Disclaimer everywhere: "For test prep only, not legal advice"

---

## Model Selection Guide

| Task | Model | Rationale |
|------|-------|-----------|
| Question generation (batch) | Sonnet | Quality + structured output, one-time |
| Question variations | Haiku | Simpler task, one-time |
| Chatbot (real-time) | Haiku | Fast, cheap, sufficient with RAG |
| Study plan generation | Haiku | Structured output from structured input |
| Mnemonic generation | Haiku | Short creative output |
| Scenario generation | Sonnet | Complex branching, one-time |
| Content QA review | Sonnet | Worth paying for accuracy |

Never use Opus for real-time user-facing features. Too slow, too expensive.

---

## Monetization Tiers

### Free Tier
- Full question bank access
- Practice tests (unlimited)
- Spaced repetition engine
- Progress tracking
- 5 AI tutor questions per day
- Basic readiness score

### Premium ($4.99/month or $9.99 one-time)
- Unlimited AI tutor access
- AI-generated personalized study plans
- AI-generated mnemonics for weak areas
- Advanced readiness analytics
- No ads (if using ads on free tier)
- Priority support
