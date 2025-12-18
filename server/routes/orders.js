import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    for (const item of products) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Each product must have a valid product_id and quantity' });
      }
    }

    const productIds = products.map(p => p.product_id);
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, price, available')
      .in('id', productIds);

    if (productError) {
      return res.status(400).json({ error: 'Failed to fetch product details' });
    }

    if (productData.length !== productIds.length) {
      return res.status(404).json({ error: 'One or more products not found' });
    }

    const unavailableProducts = productData.filter(p => !p.available);
    if (unavailableProducts.length > 0) {
      return res.status(400).json({ error: 'One or more products are not available' });
    }

    const productMap = {};
    productData.forEach(p => {
      productMap[p.id] = p.price;
    });

    let total = 0;
    const orderItems = products.map(item => {
      const price = productMap[item.product_id];
      total += price * item.quantity;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price,
      };
    });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          user_id: req.user.id,
          total,
          status: 'pending',
        },
      ])
      .select()
      .maybeSingle();

    if (orderError) {
      return res.status(400).json({ error: 'Failed to create order' });
    }

    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      return res.status(400).json({ error: 'Failed to create order items' });
    }

    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, product:products(*))
      `)
      .eq('id', order.id)
      .maybeSingle();

    if (fetchError) {
      return res.status(400).json({ error: 'Failed to fetch complete order' });
    }

    res.status(201).json(fullOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
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
      .from('orders')
      .select(`
        *,
        order_items(*, product:products(*))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: 'Failed to fetch orders' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
