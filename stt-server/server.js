// Minimal Google STT proxy server
// Usage:
// - Put your Google service account JSON path in environment variable GOOGLE_APPLICATION_CREDENTIALS
// - Optionally set STT_API_KEY to a simple API key for client->server auth
// - Ensure ffmpeg is installed on the host

const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { SpeechClient } = require('@google-cloud/speech');

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const STT_API_KEY = process.env.STT_API_KEY || '';
const client = new SpeechClient(); // requires GOOGLE_APPLICATION_CREDENTIALS

// simple API key auth to avoid public abuse
function requireApiKey(req, res, next) {
  if (!STT_API_KEY) return next(); // disabled if not set
  const key = req.headers['x-stt-key'] || req.query.key;
  if (key && key === STT_API_KEY) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.post('/api/stt/google', requireApiKey, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file uploaded' });
  const inPath = req.file.path;
  const outPath = inPath + '-16k.wav';

  try {
    await new Promise((resolve, reject) => {
      ffmpeg(inPath)
        .outputOptions(['-ar 16000', '-ac 1', '-f wav'])
        .save(outPath)
        .on('end', resolve)
        .on('error', reject);
    });

    const audioBytes = fs.readFileSync(outPath).toString('base64');

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'zh-CN',
        enableAutomaticPunctuation: true,
      },
    };

    const [response] = await client.recognize(request);
    const transcription = (response.results || [])
      .map((r) => (r.alternatives && r.alternatives[0] && r.alternatives[0].transcript) || '')
      .filter(Boolean)
      .join('\n');

    res.json({ text: transcription });
  } catch (err) {
    console.error('stt error', err);
    res.status(500).json({ error: 'stt_error', detail: String(err.message || err) });
  } finally {
    // cleanup
    try { fs.unlinkSync(inPath); } catch (e) {}
    try { fs.unlinkSync(outPath); } catch (e) {}
  }
});

app.get('/', (req, res) => res.send('STT proxy server running'));

app.listen(PORT, () => console.log(`STT server listening on ${PORT}`));
