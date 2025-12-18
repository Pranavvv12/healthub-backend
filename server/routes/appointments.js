import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { doctor_id, date_time } = req.body;

    if (!doctor_id || !date_time) {
      return res.status(400).json({ error: 'Doctor ID and date/time are required' });
    }

    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('id', doctor_id)
      .maybeSingle();

    if (doctorError || !doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: req.user.id,
          doctor_id,
          date_time,
          status: 'booked',
        },
      ])
      .select(`
        *,
        doctor:doctors(*),
        patient:profiles(*)
      `)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: 'Failed to create appointment' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(*),
        patient:profiles(*)
      `)
      .eq('patient_id', userId)
      .order('date_time', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch appointments' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patient_id !== req.user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .maybeSingle();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: 'Failed to delete appointment' });
    }

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
