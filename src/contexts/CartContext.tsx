import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  qty: number;
  price_snapshot: number;
  weight_snapshot?: number;
  product?: {
    name: string;
    slug: string;
    sku: string;
    stock_qty: number;
    images: { url: string }[];
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  cartId: string | null;
  addItem: (productId: string, price: number, qty?: number, weight?: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSessionId(): string {
  let sid = localStorage.getItem('cart_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sid);
  }
  return sid;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getOrCreateCart = useCallback(async (): Promise<string> => {
    if (cartId) return cartId;

    const sessionId = getSessionId();
    
    // Try find existing cart
    let query = supabase.from('carts').select('id');
    if (user) {
      query = query.eq('user_id', user.id);
    } else {
      query = query.eq('session_id', sessionId).is('user_id', null);
    }
    
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      setCartId(existing.id);
      return existing.id;
    }

    // Create new cart
    const insertData: any = {};
    if (user) {
      insertData.user_id = user.id;
    } else {
      insertData.session_id = sessionId;
    }

    const { data: newCart, error } = await supabase
      .from('carts')
      .insert(insertData)
      .select('id')
      .single();

    if (error || !newCart) throw new Error('Nu s-a putut crea coșul');
    setCartId(newCart.id);
    return newCart.id;
  }, [user, cartId]);

  const refreshCart = useCallback(async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      let query = supabase.from('carts').select('id');
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId).is('user_id', null);
      }
      
      const { data: cart } = await query.maybeSingle();
      if (!cart) {
        setItems([]);
        setCartId(null);
        setLoading(false);
        return;
      }

      setCartId(cart.id);
      
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select(`id, product_id, qty, price_snapshot, products(name, slug, sku, stock_qty, product_images(url), product_attributes(key, value))`)
        .eq('cart_id', cart.id);

      if (cartItems) {
        setItems(cartItems.map((ci: any) => {
          const weightAttr = ci.products?.product_attributes?.find((attr: any) => attr.key.toLowerCase() === 'greutate');
          const weight = weightAttr ? parseFloat(weightAttr.value) : 0;

          return {
            id: ci.id,
            product_id: ci.product_id,
            qty: ci.qty,
            price_snapshot: ci.price_snapshot,
            weight_snapshot: weight,
            product: ci.products ? {
              name: ci.products.name,
              slug: ci.products.slug,
              sku: ci.products.sku,
              stock_qty: ci.products.stock_qty,
              images: ci.products.product_images || [],
            } : undefined,
          };
        }));
      }
    } catch (e) {
      console.error('Cart refresh error:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [user, refreshCart]);

  const addItem = async (productId: string, price: number, qty = 1, weight = 0) => {
    try {
      const cid = await getOrCreateCart();

      // Check if item already exists
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        await updateQty(existing.id, existing.qty + qty);
        return;
      }

      // If weight not provided, fetch it from product
      let itemWeight = weight;
      if (!itemWeight) {
        const { data: product } = await supabase
          .from('products')
          .select('product_attributes(key, value)')
          .eq('id', productId)
          .single();

        if (product?.product_attributes) {
          const weightAttr = product.product_attributes.find((attr: any) => attr.key.toLowerCase() === 'greutate');
          itemWeight = weightAttr ? parseFloat(weightAttr.value) : 0;
        }
      }

      await supabase.from('cart_items').insert({
        cart_id: cid,
        product_id: productId,
        qty,
        price_snapshot: price,
      });

      toast.success('Produs adăugat în coș');
      await refreshCart();
    } catch (e: any) {
      toast.error('Eroare la adăugarea în coș');
    }
  };

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) {
      await removeItem(itemId);
      return;
    }
    await supabase.from('cart_items').update({ qty }).eq('id', itemId);
    await refreshCart();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    toast.success('Produs eliminat din coș');
    await refreshCart();
  };

  const clearCart = async () => {
    if (!cartId) return;
    await supabase.from('cart_items').delete().eq('cart_id', cartId);
    await refreshCart();
  };

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.qty * Number(i.price_snapshot), 0);
  const totalWeight = items.reduce((sum, i) => sum + (i.qty * (i.weight_snapshot || 0)), 0);

  return (
    <CartContext.Provider value={{ items, loading, cartId, addItem, updateQty, removeItem, clearCart, totalItems, totalPrice, totalWeight, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
