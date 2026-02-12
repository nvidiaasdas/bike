import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import MotoSelector from '@/components/MotoSelector';
import { useMoto } from '@/contexts/MotoContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X } from 'lucide-react';

// Extract viscosity from product name (e.g., "10W40", "5W-30", "0W20")
const extractViscosity = (name: string): string | null => {
  const viscosityPattern = /\b(\d+W[-]?\d+)\b/i;
  const match = name.match(viscosityPattern);
  return match ? match[1].toUpperCase() : null;
};

// Extract capacity from product name (e.g., "1L", "4L", "5L", "10L")
const extractCapacity = (name: string): string | null => {
  const capacityPattern = /\b(\d+(?:[.,]\d+)?)\s*L\b/i;
  const match = name.match(capacityPattern);
  return match ? match[1] + 'L' : null;
};

interface Product {
  id: string; name: string; slug: string; price: number; stock_qty: number;
  is_oem: boolean; condition: string; category_id: string;
  brands: { name: string } | null;
  product_images: { url: string }[];
  product_attributes?: { key: string; value: string }[];
  weight?: string;
}

interface Category { id: string; name: string; slug: string; parent_id: string | null }
interface Brand { id: string; name: string; slug: string }

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selected } = useMoto();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [capacities, setCapacities] = useState<string[]>([]);
  const [viscosities, setViscosities] = useState<string[]>([]);
  const [allCategoryProducts, setAllCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const qSearch = searchParams.get('q') || '';
  const qCategory = searchParams.get('category') || '';
  const qBrand = searchParams.get('brand') || '';
  const qCapacity = searchParams.get('capacity') || '';
  const qViscosity = searchParams.get('viscosity') || '';
  const qSort = searchParams.get('sort') || 'relevance';
  const showAll = searchParams.get('all') === '1';

  useEffect(() => {
    supabase.from('categories').select('id, name, slug, parent_id').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
    supabase.from('brands').select('id, name, slug').order('name').then(({ data }) => {
      if (data) setBrands(data);
    });
  }, []);

  // Fetch all products in the selected category (unfiltered) to extract available options
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!qCategory) {
        setAllCategoryProducts([]);
        setCapacities([]);
        setViscosities([]);
        return;
      }

      const cat = categories.find(c => c.slug === qCategory);
      if (!cat) return;

      const childIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
      const categoryIds = [cat.id, ...childIds];

      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, stock_qty, is_oem, condition, category_id, brands(name), product_images(url)')
        .eq('is_active', true)
        .in('category_id', categoryIds)
        .limit(100);

      if (data) {
        setAllCategoryProducts(data as any[]);

        // Extract all available capacities and viscosities from all category products
        const extractedCapacities = new Set<string>();
        const extractedViscosities = new Set<string>();

        data.forEach((product: any) => {
          const capacity = extractCapacity(product.name);
          const viscosity = extractViscosity(product.name);

          if (capacity) extractedCapacities.add(capacity);
          if (viscosity) extractedViscosities.add(viscosity);
        });

        const capacitiesArray = Array.from(extractedCapacities).sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          return numA - numB;
        });

        const viscositiesArray = Array.from(extractedViscosities).sort();

        setCapacities(capacitiesArray);
        setViscosities(viscositiesArray);
      }
    };

    fetchCategoryProducts();
  }, [qCategory, categories]);

  useEffect(() => {
    fetchProducts();
  }, [qSearch, qCategory, qBrand, qCapacity, qViscosity, qSort, selected, showAll]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('id, name, slug, price, stock_qty, is_oem, condition, category_id, brands(name), product_images(url)')
      .eq('is_active', true);

    // Category filter
    if (qCategory) {
      const cat = categories.find(c => c.slug === qCategory);
      if (cat) {
        const childIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
        query = query.in('category_id', [cat.id, ...childIds]);
      }
    }

    // Brand filter
    if (qBrand) {
      const brand = brands.find(b => b.slug === qBrand);
      if (brand) query = query.eq('brand_id', brand.id);
    }

    // Search
    if (qSearch) {
      query = query.textSearch('search_vector', qSearch, { type: 'websearch' });
    }

    // Sorting
    if (qSort === 'price_asc') query = query.order('price', { ascending: true });
    else if (qSort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const { data } = await query.limit(50);

    let results = (data || []) as any[];

    // Filter by capacity and viscosity extracted from product names
    if (qCapacity || qViscosity) {
      results = results.filter(product => {
        const capacity = extractCapacity(product.name);
        const viscosity = extractViscosity(product.name);

        if (qCapacity && capacity !== qCapacity) return false;
        if (qViscosity && viscosity !== qViscosity) return false;
        return true;
      });
    }

    // Filter by moto compatibility if selected
    if (selected?.variantId && !showAll) {
      const { data: compat } = await supabase
        .from('compatibilities')
        .select('product_id')
        .eq('moto_variant_id', selected.variantId);

      if (compat && compat.length > 0) {
        const compatIds = new Set(compat.map(c => c.product_id));
        results = results.filter(p => compatIds.has(p.id));
      }
      // If no compatibility data exists, show all products anyway
      // (compatibility data might not be set up for all categories)
    }

    setProducts(results);
    setLoading(false);
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);

    // Clear capacity/viscosity filters when changing category
    if (key === 'category') {
      params.delete('capacity');
      params.delete('viscosity');
    }

    setSearchParams(params);
  };

  const rootCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Catalog Piese</h1>
          {selected && !showAll && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Piese pentru {selected.makeName} {selected.modelName}
              </Badge>
              <button onClick={() => setParam('all', '1')} className="text-xs text-primary hover:underline">
                Vezi toate piesele
              </button>
            </div>
          )}
          {showAll && selected && (
            <button onClick={() => setParam('all', '')} className="text-xs text-primary hover:underline mt-2 block">
              Arată doar piese compatibile
            </button>
          )}
        </div>
        <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtre
        </Button>
      </div>

      {/* Mobile filters backdrop */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowFilters(false)}
        />
      )}

      <div className="flex gap-8 relative">
        {/* Sidebar filters */}
        <aside className={`fixed md:static inset-0 md:inset-auto w-full md:w-64 md:shrink-0 z-50 md:z-auto ${showFilters ? 'block' : 'hidden'} md:block bg-background md:bg-transparent ${showFilters ? 'overflow-y-auto' : ''}`}>
          {/* Close button on mobile */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
            <h2 className="font-heading font-bold">Filtre</h2>
            <button onClick={() => setShowFilters(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 p-4 md:p-0">
            {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Caută</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={qSearch}
                onChange={e => setParam('q', e.target.value)}
                placeholder="Nume, cod, brand..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categorie</label>
            <div className="space-y-1">
              <button
                onClick={() => setParam('category', '')}
                className={`block text-sm w-full text-left px-3 py-1.5 rounded transition-colors ${!qCategory ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Toate categoriile
              </button>
              {rootCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setParam('category', cat.slug)}
                  className={`block text-sm w-full text-left px-3 py-1.5 rounded transition-colors ${qCategory === cat.slug ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="text-sm font-medium mb-2 block">Brand</label>
            <Select value={qBrand} onValueChange={v => setParam('brand', v === 'all' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Toate brandurile" />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={4}>
                <SelectItem value="all">Toate brandurile</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity filter - only for motor oil */}
          {qCategory === 'ulei-motor' && capacities.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Capacitate</label>
              <Select value={qCapacity} onValueChange={v => setParam('capacity', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toate capacitățile" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">Toate capacitățile</SelectItem>
                  {capacities.map(cap => (
                    <SelectItem key={cap} value={cap}>{cap}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Viscosity filter - only for motor oil */}
          {qCategory === 'ulei-motor' && viscosities.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Vâscozitate</label>
              <Select value={qViscosity} onValueChange={v => setParam('viscosity', v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Toate vâscozitățile" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={4}>
                  <SelectItem value="all">Toate vâscozitățile</SelectItem>
                  {viscosities.map(visc => (
                    <SelectItem key={visc} value={visc}>{visc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Moto selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Motocicleta</label>
            <MotoSelector compact />
          </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">{products.length} produse</span>
            <Select value={qSort} onValueChange={v => setParam('sort', v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="end" sideOffset={4}>
                <SelectItem value="relevance">Cele mai noi</SelectItem>
                <SelectItem value="price_asc">Preț crescător</SelectItem>
                <SelectItem value="price_desc">Preț descrescător</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted rounded-lg animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nu am găsit produse cu filtrele selectate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(p => (
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
          )}
        </div>
      </div>
    </div>
  );
}
