require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the frontend hosted on GitHub Pages can call this backend
app.use(cors());
app.use(express.json());

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemText } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    // Call Anthropic API from the secure backend
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1000,
        system: systemText,
        messages: messages
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API Error:', response.status, errBody);
      return res.status(response.status).json({ error: `Anthropic API error: ${response.status}` });
    }

    const data = await response.json();
    const reply = data.content?.find(b => b.type === 'text')?.text || '';

    res.json({ reply: reply.trim() });

  } catch (error) {
    console.error('Error handling chat request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple health check route
app.get('/', (req, res) => {
  res.send('Voice AI Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
