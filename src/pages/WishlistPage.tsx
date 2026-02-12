import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchWishlist = async () => {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id, products(id, name, slug, price, stock_qty, is_oem, condition, brands(name), product_images(url))')
        .eq('user_id', user.id);
      if (data) setProducts(data.map((w: any) => w.products).filter(Boolean));
      setLoading(false);
    };
    fetchWishlist();
  }, [user]);

  if (!user) return <Navigate to="/auth" />;
  if (loading) return <div className="container py-12"><div className="bg-muted animate-pulse h-64 rounded-lg" /></div>;

  return (
    <div className="container py-8">
      <h1 className="font-heading text-3xl font-bold mb-8 flex items-center gap-2">
        <Heart className="w-8 h-8 text-primary" /> Favorite
      </h1>
      {products.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nu ai produse favorite.</p>
          <Link to="/catalog" className="text-primary hover:underline text-sm mt-2 block">Explorează catalogul</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={{ ...p, brand: p.brands, images: p.product_images }} />
          ))}
        </div>
      )}
    </div>
  );
}
