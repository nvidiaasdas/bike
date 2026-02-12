import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Heart, Minus, Plus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [compatModels, setCompatModels] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select(`*, brands(name, slug), categories(name, slug), product_images(id, url, sort_order), product_attributes(id, key, value)`)
        .eq('slug', slug)
        .single();

      if (data) {
        setProduct(data);
        
        // Fetch compatibilities
        const { data: compat } = await supabase
          .from('compatibilities')
          .select('moto_variants(id, year_from, year_to, engine, trim, moto_models(name, moto_makes(name)))')
          .eq('product_id', data.id);
        
        if (compat) setCompatModels(compat.map((c: any) => c.moto_variants));

        // Check wishlist
        if (user) {
          const { data: wl } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', data.id)
            .maybeSingle();
          setInWishlist(!!wl);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug, user]);

  const toggleWishlist = async () => {
    if (!user || !product) {
      toast.error('Conectează-te pentru a adăuga la favorite');
      return;
    }
    if (inWishlist) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      setInWishlist(false);
      toast.success('Eliminat din favorite');
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      setInWishlist(true);
      toast.success('Adăugat la favorite');
    }
  };

  if (loading) {
    return <div className="container py-12"><div className="bg-muted animate-pulse h-96 rounded-lg" /></div>;
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground">Produsul nu a fost găsit.</p>
        <Link to="/catalog"><Button className="mt-4">Înapoi la catalog</Button></Link>
      </div>
    );
  }

  const images = product.product_images?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || [];
  const mainImage = images[selectedImage]?.url || '/placeholder.svg';
  const inStock = product.stock_qty > 0;
  const weight = product.product_attributes?.find((attr: any) => attr.key?.toLowerCase() === 'greutate')?.value;

  return (
    <div className="container py-8">
      <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Înapoi la catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {images.map((img: any, i: number) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded border overflow-hidden ${i === selectedImage ? 'border-primary' : 'border-border'}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.brands && (
              <Badge variant="secondary">{product.brands.name}</Badge>
            )}
            {product.is_oem && <Badge variant="outline">OEM</Badge>}
            {product.condition === 'sh' && <Badge variant="outline">SH</Badge>}
          </div>

          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
            <span>SKU: {product.sku}</span>
            {product.categories && <span>• {product.categories.name}</span>}
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-heading text-4xl font-extrabold text-primary">
              {Number(product.price).toFixed(2)}
            </span>
            <span className="text-muted-foreground">RON</span>
            <span className="text-xs text-muted-foreground">(TVA {product.vat_rate}% inclus)</span>
          </div>

          {/* Stock */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {inStock ? (
                <>
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-success font-medium">În stoc ({product.stock_qty} buc)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="text-destructive font-medium">pe comanda</span>
                </>
              )}
            </div>
            {!inStock && weight && (
              <p className="text-sm text-muted-foreground">Greutate: {weight}</p>
            )}
          </div>

          {/* Qty + Add to cart */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-border rounded-md">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} className="h-10 w-10">
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center border-0 h-10"
                min={1}
                max={product.stock_qty}
              />
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(product.stock_qty, qty + 1))} className="h-10 w-10">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              size="lg"
              disabled={!inStock}
              onClick={() => addItem(product.id, Number(product.price), qty)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Adaugă în coș
            </Button>

            <Button variant="outline" size="icon" onClick={toggleWishlist} className={inWishlist ? 'text-primary border-primary' : ''}>
              <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="font-heading font-bold mb-2">Descriere</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Attributes */}
          {product.product_attributes?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-heading font-bold mb-2">Specificații</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.product_attributes.map((attr: any) => (
                  <div key={attr.id} className="flex justify-between p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">{attr.key}</span>
                    <span className="font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility */}
          {compatModels.length > 0 && (
            <div>
              <h3 className="font-heading font-bold mb-2">Compatibil cu</h3>
              <div className="space-y-1">
                {compatModels.map((v: any) => (
                  <div key={v.id} className="text-sm text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    {v.moto_models?.moto_makes?.name} {v.moto_models?.name} {v.year_from}-{v.year_to || 'prezent'} {v.engine}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
