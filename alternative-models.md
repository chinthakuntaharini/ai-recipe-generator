# Alternative Bedrock Models

If Anthropic Claude models require approval, try these alternatives:

## Amazon Models (Usually Available Immediately)
- `amazon.titan-text-express-v1` - Good for text generation
- `amazon.titan-text-lite-v1` - Lighter version
- `amazon.titan-embed-text-v1` - For embeddings

## AI21 Labs Models
- `ai21.j2-mid-v1` - Mid-size model
- `ai21.j2-ultra-v1` - Larger model

## Cohere Models
- `cohere.command-text-v14` - Command model
- `cohere.command-light-text-v14` - Lighter version

## Meta Models
- `meta.llama2-13b-chat-v1` - Llama 2 chat model
- `meta.llama2-70b-chat-v1` - Larger Llama 2 model

## Request Format Examples

### Amazon Titan
```json
{
  "inputText": "Generate a recipe...",
  "textGenerationConfig": {
    "maxTokenCount": 2000,
    "temperature": 0.7,
    "topP": 0.9
  }
}
```

### AI21 Labs
```json
{
  "prompt": "Generate a recipe...",
  "maxTokens": 2000,
  "temperature": 0.7,
  "topP": 0.9
}
```

### Cohere
```json
{
  "prompt": "Generate a recipe...",
  "max_tokens": 2000,
  "temperature": 0.7,
  "p": 0.9
}
```

### Meta Llama
```json
{
  "prompt": "Generate a recipe...",
  "max_gen_len": 2000,
  "temperature": 0.7,
  "top_p": 0.9
}
```