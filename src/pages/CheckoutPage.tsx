import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { z } from 'zod';

const addressSchema = z.object({
  full_name: z.string().trim().min(2, 'Numele este obligatoriu').max(100),
  phone: z.string().trim().min(9, 'Telefonul este obligatoriu').max(15),
  city: z.string().trim().min(2, 'Orașul este obligatoriu').max(100),
  county: z.string().trim().min(2, 'Județul este obligatoriu').max(100),
  street: z.string().trim().min(5, 'Adresa este obligatorie').max(200),
  zip: z.string().trim().min(5, 'Codul poștal este obligatoriu').max(10),
});

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart, cartId } = useCart();
  const navigate = useNavigate();
  
  const [shippingMethod, setShippingMethod] = useState('curier');
  const [paymentMethod, setPaymentMethod] = useState('ramburs');
  const [address, setAddress] = useState({ full_name: '', phone: '', city: '', county: '', street: '', zip: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  if (!user) return <Navigate to="/auth" state={{ from: { pathname: '/checkout' } }} />;
  if (items.length === 0) return <Navigate to="/cart" />;

  const shippingCost = totalPrice > 500 ? 0 : (shippingMethod === 'curier' ? 25 : 15);
  const grandTotal = totalPrice - discount + shippingCost;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (!coupon) { toast.error('Cupon invalid'); return; }
    if (coupon.min_total && totalPrice < Number(coupon.min_total)) {
      toast.error(`Comandă minimă: ${coupon.min_total} RON`); return;
    }

    const disc = coupon.type === 'percent' 
      ? totalPrice * Number(coupon.value) / 100 
      : Number(coupon.value);
    setDiscount(Math.min(disc, totalPrice));
    toast.success(`Cupon aplicat: -${disc.toFixed(2)} RON`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      addressSchema.parse(address);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fe: Record<string, string> = {};
        err.errors.forEach(e => { fe[e.path[0] as string] = e.message; });
        setErrors(fe);
        return;
      }
    }

    setSubmitting(true);
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        subtotal: totalPrice,
        shipping_cost: shippingCost,
        discount,
        total: grandTotal,
        shipping_address: address,
        billing_address: address,
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        coupon_code: couponCode || null,
      })
      .select('id')
      .single();

    if (error || !order) {
      toast.error('Eroare la plasarea comenzii');
      setSubmitting(false);
      return;
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      name_snapshot: item.product?.name || '',
      sku_snapshot: item.product?.sku || '',
      qty: item.qty,
      unit_price: Number(item.price_snapshot),
    }));

    await supabase.from('order_items').insert(orderItems);
    await clearCart();

    toast.success('Comanda a fost plasată cu succes!');
    navigate('/account');
    setSubmitting(false);
  };

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Finalizare Comandă</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Adresa de livrare</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['full_name', 'phone', 'city', 'county', 'street', 'zip'] as const).map(field => (
                <div key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                  <Label>{
                    { full_name: 'Nume complet', phone: 'Telefon', city: 'Oraș', county: 'Județ', street: 'Adresă', zip: 'Cod poștal' }[field]
                  }</Label>
                  <Input
                    value={address[field]}
                    onChange={e => setAddress({ ...address, [field]: e.target.value })}
                  />
                  {errors[field] && <p className="text-destructive text-xs mt-1">{errors[field]}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Metoda de livrare</h3>
            <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-md border-border">
                <RadioGroupItem value="curier" id="curier" />
                <Label htmlFor="curier" className="flex-1 cursor-pointer">Curier la adresă — {totalPrice > 500 ? 'Gratuit' : '25 RON'}</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md border-border mt-2">
                <RadioGroupItem value="locker" id="locker" />
                <Label htmlFor="locker" className="flex-1 cursor-pointer">Easybox / Locker — {totalPrice > 500 ? 'Gratuit' : '15 RON'}</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="font-heading font-bold text-lg mb-4">Metoda de plată</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-md border-border">
                <RadioGroupItem value="ramburs" id="ramburs" />
                <Label htmlFor="ramburs" className="cursor-pointer">Ramburs la livrare</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-md border-border mt-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer">Card online (în curând)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg border border-border p-6 h-fit sticky top-32">
          <h3 className="font-heading font-bold text-lg mb-4">Sumar comandă</h3>
          
          <div className="space-y-2 text-sm mb-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground line-clamp-1">{item.product?.name} x{item.qty}</span>
                <span>{(Number(item.price_snapshot) * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{totalPrice.toFixed(2)} RON</span></div>
            {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>-{discount.toFixed(2)} RON</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Transport</span><span>{shippingCost === 0 ? 'Gratuit' : `${shippingCost} RON`}</span></div>
          </div>

          {/* Coupon */}
          <div className="flex gap-2 mt-4">
            <Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Cod cupon" className="text-sm" />
            <Button type="button" variant="outline" size="sm" onClick={applyCoupon}>Aplică</Button>
          </div>

          <div className="border-t border-border mt-4 pt-3">
            <div className="flex justify-between font-heading font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{grandTotal.toFixed(2)} RON</span>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" disabled={submitting}>
            {submitting ? 'Se procesează...' : 'Plasează comanda'}
          </Button>
        </div>
      </form>
    </div>
  );
}
