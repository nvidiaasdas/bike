import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import MotoSelector from '@/components/MotoSelector';
import { useMoto } from '@/contexts/MotoContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const SUPABASE_URL = 'https://cgboawjncqqasijhqgkv.supabase.co';
const API_KEY = 'sb_publishable_3w5FPK8BTYy6JQIuzHcFVA_rWVwrt5_';

const headers = {
  'apikey': API_KEY,
  'Content-Type': 'application/json',
};

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
    // Fetch categories via REST API
    fetch(`${SUPABASE_URL}/rest/v1/categories?order=sort_order.asc`, { headers })
      .then(r => r.json())
      .then(data => {
        console.log('Categories:', data);
        setCategories(data || []);
      })
      .catch(err => console.error('Categories error:', err));

    // Fetch brands via REST API
    fetch(`${SUPABASE_URL}/rest/v1/brands?order=name.asc`, { headers })
      .then(r => r.json())
      .then(data => {
        console.log('Brands:', data);
        setBrands(data || []);
      })
      .catch(err => console.error('Brands error:', err));
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

      try {
        // Fetch products for this category
        const categoryFilter = categoryIds.map(id => `category_id=eq.${id}`).join(',');
        const url = `${SUPABASE_URL}/rest/v1/products?and=(is_active=eq.true,or=(${categoryFilter}))&limit=100`;
        const response = await fetch(url, { headers });
        const data = await response.json();

        if (data && Array.isArray(data)) {
          // Fetch images for category products
          let dataWithImages = data;
          if (data.length > 0) {
            const productIds = data.map(p => p.id);
            try {
              const imagesUrl = `${SUPABASE_URL}/rest/v1/product_images?product_id=in.(${productIds.join(',')})`;
              const imagesRes = await fetch(imagesUrl, { headers });
              const images = await imagesRes.json();
              dataWithImages = data.map((p: any) => ({
                ...p,
                product_images: (images || []).filter((img: any) => img.product_id === p.id),
              }));
            } catch (err) {
              console.error('Category images error:', err);
            }
          }

          setAllCategoryProducts(dataWithImages);

          // Extract all available capacities and viscosities from all category products
          const extractedCapacities = new Set<string>();
          const extractedViscosities = new Set<string>();

          dataWithImages.forEach((product: any) => {
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

          console.log('Capacities:', capacitiesArray, 'Viscosities:', viscositiesArray);
          setCapacities(capacitiesArray);
          setViscosities(viscositiesArray);
        }
      } catch (err) {
        console.error('Category products fetch error:', err);
      }
    };

    fetchCategoryProducts();
  }, [qCategory, categories]);

  useEffect(() => {
    fetchProducts();
  }, [qSearch, qCategory, qBrand, qCapacity, qViscosity, qSort, selected, showAll]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${SUPABASE_URL}/rest/v1/products?is_active=eq.true`;

      // Category filter
      if (qCategory) {
        const cat = categories.find(c => c.slug === qCategory);
        if (cat) {
          const childIds = categories.filter(c => c.parent_id === cat.id).map(c => c.id);
          const categoryIds = [cat.id, ...childIds];
          const categoryFilter = categoryIds.map(id => `category_id=eq.${id}`).join(',');
          url += `&or=(${categoryFilter})`;
        }
      }

      // Brand filter
      if (qBrand) {
        const brand = brands.find(b => b.slug === qBrand);
        if (brand) {
          url += `&brand_id=eq.${brand.id}`;
        }
      }

      // Sorting
      if (qSort === 'price_asc') url += '&order=price.asc';
      else if (qSort === 'price_desc') url += '&order=price.desc';
      else url += '&order=created_at.desc';

      url += '&limit=50';

      const response = await fetch(url, { headers });
      let results = await response.json();

      // Ensure results is an array
      if (!Array.isArray(results)) {
        console.error('Invalid response from products endpoint:', results);
        results = [];
      }

      // Filter by capacity and viscosity extracted from product names
      if (qCapacity || qViscosity) {
        results = results.filter((product: any) => {
          const capacity = extractCapacity(product.name);
          const viscosity = extractViscosity(product.name);

          if (qCapacity && capacity !== qCapacity) return false;
          if (qViscosity && viscosity !== qViscosity) return false;
          return true;
        });
      }

      // Filter by moto compatibility if selected
      if (selected?.variantId && !showAll) {
        try {
          const compatUrl = `${SUPABASE_URL}/rest/v1/compatibilities?moto_variant_id=eq.${selected.variantId}`;
          console.log('Fetching compatibilities from:', compatUrl);
          const compatResponse = await fetch(compatUrl, { headers });
          const compat = await compatResponse.json();

          console.log('Compatibility result:', compat);

          if (Array.isArray(compat) && compat.length > 0) {
            console.log(`Found ${compat.length} compatible products`);
            const compatIds = new Set(compat.map((c: any) => c.product_id));
            results = results.filter((p: any) => compatIds.has(p.id));
          } else {
            // If no compatible items found, set results to empty
            console.log('No compatible products found for variant:', selected.variantId);
            results = [];
          }
        } catch (err) {
          console.error('Compatibility filter error:', err);
        }
      }

      // Fetch images for all products
      if (results && results.length > 0) {
        const productIds = results.map(p => p.id);
        try {
          const imagesUrl = `${SUPABASE_URL}/rest/v1/product_images?product_id=in.(${productIds.join(',')})&order=sort_order.asc`;
          const imagesResponse = await fetch(imagesUrl, { headers });
          const images = await imagesResponse.json();

          // Attach images to products
          results = results.map((product: any) => ({
            ...product,
            product_images: (images || []).filter((img: any) => img.product_id === product.id),
          }));
        } catch (err) {
          console.error('Images fetch error:', err);
        }
      }

      // Final safety check
      setProducts(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error('Products fetch error:', err);
      setProducts([]);
    }
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
          ) : !Array.isArray(products) || products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Nu am găsit produse cu filtrele selectate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.isArray(products) && products.map(p => (
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
