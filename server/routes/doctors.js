import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { specialty, hospital } = req.query;

    let query = supabase.from('doctors').select('*');

    if (specialty) {
      query = query.ilike('specialty', `%${specialty}%`);
    }

    if (hospital) {
      query = query.ilike('hospital', `%${hospital}%`);
    }

    const { data, error } = await query.order('name');

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch doctors' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch doctor' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, specialty, hospital, languages, profile_image, rating } = req.body;

    if (!name || !specialty || !hospital) {
      return res.status(400).json({ error: 'Name, specialty, and hospital are required' });
    }

    const { data, error } = await supabase
      .from('doctors')
      .insert([
        {
          name,
          specialty,
          hospital,
          languages: languages || [],
          profile_image,
          rating: rating || 0,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: 'Failed to create doctor' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, hospital, languages, profile_image, rating } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (hospital !== undefined) updateData.hospital = hospital;
    if (languages !== undefined) updateData.languages = languages;
    if (profile_image !== undefined) updateData.profile_image = profile_image;
    if (rating !== undefined) updateData.rating = rating;

    const { data, error } = await supabase
      .from('doctors')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: 'Failed to update doctor' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('doctors')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: 'Failed to delete doctor' });
    }

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

export default router;
