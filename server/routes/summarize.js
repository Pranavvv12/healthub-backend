import express from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', authenticate, upload.single('report'), async (req, res) => {
  try {
    let reportText = req.body.report_text;

    if (req.file) {
      reportText = req.file.buffer.toString('utf-8');
    }

    if (!reportText) {
      return res.status(400).json({ error: 'Report text or file is required' });
    }

    const summarizerUrl = process.env.SUMMARIZER_SERVICE_URL || 'http://localhost:5000';

    const response = await fetch(`${summarizerUrl}/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: reportText }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Summarizer service error:', errorText);
      return res.status(502).json({
        error: 'Failed to get summary from AI service',
        details: errorText
      });
    }

    const summaryResult = await response.json();
    const summary = summaryResult.summary || summaryResult.result || '';

    const { data, error } = await supabase
      .from('report_summaries')
      .insert([
        {
          user_id: req.user.id,
          original_report: reportText,
          summary,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: 'Failed to save summary' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to process report' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('report_summaries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch summaries' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

export default router;
