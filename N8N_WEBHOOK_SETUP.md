# N8N Webhook Setup Guide for SafeLeaf Kitchen

## Overview

SafeLeaf Kitchen now supports N8N webhooks as an alternative to OpenRouter for chat functionality. This allows you to use N8N workflows to process chat messages and return responses.

## How It Works

1. **App sends request**: When a user sends a message, the app sends a POST request to your N8N webhook
2. **N8N processes**: Your N8N workflow processes the message using any AI service or logic
3. **N8N responds**: N8N sends back the response which the app displays to the user

## Request Format

The app sends the following JSON payload to your N8N webhook:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are SafeLeafKitchen, a knowledgeable cooking and nutrition assistant..."
    },
    {
      "role": "user", 
      "content": "What are the health benefits of onion leaves?"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sessionId": "session_1705312200000_abc123def",
  "metadata": {
    "source": "safeleafkitchen",
    "version": "1.0.0"
  }
}
```

### Message Structure
- `messages`: Array of chat messages in OpenAI format
- `timestamp`: ISO timestamp of the request
- `sessionId`: Unique session identifier
- `metadata`: App metadata for identification

## Response Format

Your N8N workflow should return one of these response formats:

### Option 1: Direct Text Response
```json
"Here are the health benefits of onion leaves: They are rich in antioxidants, contain vitamin C, and have anti-inflammatory properties..."
```

### Option 2: Structured Response with 'response' Field
```json
{
  "response": "Here are the health benefits of onion leaves: They are rich in antioxidants, contain vitamin C, and have anti-inflammatory properties..."
}
```

### Option 3: Structured Response with 'message' Field
```json
{
  "message": "Here are the health benefits of onion leaves: They are rich in antioxidants, contain vitamin C, and have anti-inflammatory properties..."
}
```

### Option 4: Structured Response with 'content' Field
```json
{
  "content": "Here are the health benefits of onion leaves: They are rich in antioxidants, contain vitamin C, and have anti-inflammatory properties..."
}
```

## N8N Workflow Configuration

### Step 1: Create Webhook Node
1. Add a **Webhook** node to your workflow
2. Set the HTTP method to **POST**
3. Copy the webhook URL (e.g., `https://your-n8n-instance.com/webhook/chat`)
4. Add this URL to your SafeLeaf Kitchen settings

### Step 2: Process the Request
Add nodes to process the incoming message:

#### Option A: Using OpenAI in N8N
```json
{
  "model": "gpt-3.5-turbo",
  "messages": "{{ $json.messages }}",
  "temperature": 0.3,
  "max_tokens": 200
}
```

#### Option B: Using Anthropic Claude
```json
{
  "model": "claude-3-sonnet-20240229",
  "messages": "{{ $json.messages }}",
  "max_tokens": 200
}
```

#### Option C: Custom Logic
You can add any custom processing:
- Database lookups
- External API calls
- Conditional logic
- Multiple AI model calls

### Step 3: Format the Response
Add a **Set** node to format the response:

```json
{
  "response": "{{ $json.choices[0].message.content }}"
}
```

Or for direct text:
```json
"{{ $json.choices[0].message.content }}"
```

### Step 4: Return Response
Connect your response to the webhook node's output.

## Example N8N Workflow

Here's a complete example workflow:

```json
{
  "name": "SafeLeaf Chat Assistant",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "chat",
        "responseMode": "responseNode"
      },
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "openAiApi",
        "operation": "chatCompletion",
        "model": "gpt-3.5-turbo",
        "messages": "={{ $json.messages }}",
        "options": {
          "temperature": 0.3,
          "maxTokens": 200
        }
      },
      "id": "openai",
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "response",
              "value": "={{ $json.choices[0].message.content }}"
            }
          ]
        }
      },
      "id": "format",
      "name": "Format Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "OpenAI",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI": {
      "main": [
        [
          {
            "node": "Format Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Response": {
      "main": [
        [
          {
            "node": "Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# N8N Configuration
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chat
```

## Testing Your Webhook

### Using curl
```bash
curl -X POST https://your-n8n-instance.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the health benefits of onion leaves?"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "sessionId": "test_session_123",
    "metadata": {
      "source": "safeleafkitchen",
      "version": "1.0.0"
    }
  }'
```

### Expected Response
```json
{
  "response": "Onion leaves are rich in antioxidants, particularly quercetin, which has anti-inflammatory properties. They also contain vitamin C, vitamin K, and fiber. These nutrients support immune function, bone health, and digestive health."
}
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**: N8N workflows should respond within 30 seconds
2. **Empty Response**: Ensure your workflow returns valid JSON or text
3. **CORS Issues**: Configure N8N to allow requests from your app domain
4. **Authentication**: If using API keys, store them securely in N8N credentials

### Debug Tips

1. **Check N8N Logs**: Monitor the execution logs in N8N
2. **Test Webhook**: Use the curl command above to test independently
3. **Validate JSON**: Ensure your response is valid JSON
4. **Check Headers**: Verify Content-Type is application/json

## Advanced Features

### Session Management
Use the `sessionId` to maintain conversation context across multiple messages.

### Error Handling
Return error responses in this format:
```json
{
  "error": "Unable to process request",
  "details": "Specific error message"
}
```

### Rate Limiting
Implement rate limiting in your N8N workflow to prevent abuse.

### Logging
Log all requests and responses for monitoring and debugging.

## Security Considerations

1. **Webhook Security**: Use HTTPS and consider adding authentication
2. **API Keys**: Store API keys securely in N8N credentials
3. **Input Validation**: Validate incoming messages in your workflow
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Switching Between Providers

In the SafeLeaf Kitchen app:
1. Go to Settings (gear icon)
2. Select "Chat Provider"
3. Choose between "OpenRouter" or "N8N Webhook"
4. Enter your N8N webhook URL
5. Save settings

The app will automatically use the selected provider for all chat interactions.
