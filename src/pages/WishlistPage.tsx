import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/ProductCard';
import { Heart } from 'lucide-react';

const SUPABASE_URL = 'https://cgboawjncqqasijhqgkv.supabase.co';
const API_KEY = 'sb_publishable_3w5FPK8BTYy6JQIuzHcFVA_rWVwrt5_';

export default function WishlistPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchWishlist = async () => {
      try {
        const headers = {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
        };

        // Fetch wishlist items
        const wishRes = await fetch(`${SUPABASE_URL}/rest/v1/wishlists?user_id=eq.${user.id}`, { headers });
        const wishlists = await wishRes.json();

        if (wishlists && wishlists.length > 0) {
          const productIds = wishlists.map((w: any) => w.product_id);

          // Fetch products
          const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(',')})`, { headers });
          const productsData = await productsRes.json();

          // Fetch images for products
          const imagesRes = await fetch(`${SUPABASE_URL}/rest/v1/product_images?product_id=in.(${productIds.join(',')})`, { headers });
          const images = await imagesRes.json();

          // Attach images to products
          const productsWithImages = productsData.map((p: any) => ({
            ...p,
            product_images: (images || []).filter((img: any) => img.product_id === p.id),
          }));

          setProducts(productsWithImages);
        }
      } catch (err) {
        console.error('Wishlist fetch error:', err);
      }
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
