import { Link } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, totalPrice, updateQty, removeItem, loading } = useCart();
  const { user } = useAuth();

  if (loading) {
    return <div className="container py-12"><div className="bg-muted animate-pulse h-64 rounded-lg" /></div>;
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading text-2xl font-bold mb-2">Coșul este gol</h1>
        <p className="text-muted-foreground mb-6">Adaugă piese din catalog pentru a începe.</p>
        <Link to="/catalog">
          <Button className="bg-primary text-primary-foreground">Explorează catalogul</Button>
        </Link>
      </div>
    );
  }

  const shippingEstimate = totalPrice > 500 ? 0 : 25;
  const grandTotal = totalPrice + shippingEstimate;

  return (
    <div className="container py-8">
      <h1 className="font-heading text-3xl font-bold mb-8">Coșul Meu</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 p-4 bg-card rounded-lg border border-border">
              <div className="w-20 h-20 rounded bg-muted overflow-hidden shrink-0">
                <img
                  src={item.product?.images?.[0]?.url || '/placeholder.svg'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product?.slug}`} className="font-heading font-semibold text-sm hover:text-primary line-clamp-1">
                  {item.product?.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{item.product?.sku}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-border rounded">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, item.qty - 1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, item.qty + 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-primary">
                      {(Number(item.price_snapshot) * item.qty).toFixed(2)} RON
                    </span>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg border border-border p-6 h-fit sticky top-32">
          <h3 className="font-heading text-lg font-bold mb-4">Sumar Comandă</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{totalPrice.toFixed(2)} RON</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transport</span>
              <span>{shippingEstimate === 0 ? <span className="text-success">Gratuit</span> : `${shippingEstimate.toFixed(2)} RON`}</span>
            </div>
            {shippingEstimate > 0 && (
              <p className="text-xs text-muted-foreground">Transport gratuit pentru comenzi peste 500 RON</p>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{grandTotal.toFixed(2)} RON</span>
              </div>
            </div>
          </div>

          <Link to={user ? '/checkout' : '/auth'} state={{ from: { pathname: '/checkout' } }}>
            <Button className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
              {user ? 'Finalizează comanda' : 'Conectează-te pentru comandă'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
