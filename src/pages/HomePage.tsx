import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MotoSelector from '@/components/MotoSelector';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Truck, RotateCcw, Bike } from 'lucide-react';
import heroImage from '@/assets/hero-moto.jpg';

interface Category { id: string; name: string; slug: string; icon: string | null }
interface Product {
  id: string; name: string; slug: string; price: number; stock_qty: number;
  is_oem: boolean; condition: string;
  brands: { name: string } | null;
  product_images: { url: string }[];
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from('categories').select('id, name, slug, icon')
      .is('parent_id', null).order('sort_order')
      .then(({ data }) => { if (data) setCategories(data); });

    supabase.from('products').select('id, name, slug, price, stock_qty, is_oem, condition, brands(name), product_images(url)')
      .eq('is_active', true).order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setFeatured(data as any); });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <img src={heroImage} alt="Piese moto" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-transparent" />
        <div className="container relative z-10 h-full flex items-center">
          <div className="max-w-xl">
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-secondary-foreground leading-tight mb-4">
              PIESE MOTO<br />
              <span className="text-primary">PREMIUM</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Cele mai bune piese și accesorii pentru motocicleta ta. Branduri de top, livrare rapidă în toată România.
            </p>
            <div className="flex gap-3">
              <Link to="/catalog">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading font-bold text-base">
                  Vezi Catalogul <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Moto Selector */}
      <section className="container -mt-12 relative z-20">
        <MotoSelector />
      </section>

      {/* Features */}
      <section className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: 'Livrare Rapidă', desc: '1-3 zile lucrătoare în toată România' },
            { icon: Shield, title: 'Garanție', desc: 'Toate produsele vin cu garanția producătorului' },
            { icon: RotateCcw, title: 'Retur 14 Zile', desc: 'Returnare gratuită în primele 14 zile' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 p-6 rounded-lg bg-card border border-border">
              <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <f.icon className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">{f.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12">
        <h2 className="font-heading text-3xl font-bold mb-8">Categorii Populare</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/catalog?category=${cat.slug}`}
              className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                <Bike className="w-7 h-7 text-accent-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-heading font-bold text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-3xl font-bold">Produse Recomandate</h2>
          <Link to="/catalog">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Vezi toate <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featured.map(p => (
            <ProductCard
              key={p.id}
              product={{
                ...p,
                brand: p.brands,
                images: p.product_images,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
