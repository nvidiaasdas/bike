import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Heart, Search, Menu, X, Bike, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useMoto } from '@/contexts/MotoContext';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface Category { id: string; name: string; slug: string; parent_id: string | null }

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const { selected, clearSelection } = useMoto();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Fetch root categories from database
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, parent_id')
          .order('sort_order');

        if (error) {
          console.error('Supabase error fetching categories:', error);
          return;
        }

        console.log('Categories fetched:', data);
        if (data) {
          // Filter for root categories (no parent_id)
          const rootCats = data.filter(c => !c.parent_id);
          setCategories(rootCats);
        }
      } catch (err) {
        console.error('Exception fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-secondary border-b border-secondary/50">
      {/* Top bar with moto selection */}
      {selected && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container flex items-center justify-between py-1 text-sm">
            <div className="flex items-center gap-2">
              <Bike className="w-4 h-4 text-primary" />
              <span className="text-secondary-foreground">
                Piese pentru: <strong className="text-primary">{selected.makeName} {selected.modelName} {selected.variantLabel}</strong>
              </span>
            </div>
            <button onClick={clearSelection} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1">
              <X className="w-3 h-3" /> Resetează
            </button>
          </div>
        </div>
      )}

      <div className="container flex items-center justify-between gap-4 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
            <Bike className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold text-secondary-foreground tracking-wide hidden sm:block">
            MOTO<span className="text-primary">PARTS</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută piese, cod, brand..."
              className="pl-10 bg-secondary/80 border-secondary text-secondary-foreground placeholder:text-muted-foreground"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/wishlist">
              <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-primary">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
          )}

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-primary">
              <ShoppingCart className="w-5 h-5" />
            </Button>
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                {totalItems}
              </Badge>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <Link to={isAdmin ? '/admin' : '/account'}>
                <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-primary">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-primary" onClick={signOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Conectează-te
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-secondary-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Nav links */}
      <nav className="hidden md:block border-t border-secondary/30">
        <div className="container flex items-center gap-6 h-10 text-sm">
          <Link to="/catalog" className="text-secondary-foreground hover:text-primary font-medium transition-colors">
            Catalog Piese
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} to={`/catalog?category=${cat.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
              {cat.name}
            </Link>
          ))}
          {user && (
            <Link to="/garage" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Bike className="w-3.5 h-3.5" /> Garajul Meu
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-secondary border-t border-secondary/30 animate-fade-in">
          <div className="container py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Caută piese..."
                  className="pl-10 bg-secondary/80 border-secondary text-secondary-foreground"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/catalog" className="text-secondary-foreground hover:text-primary py-1" onClick={() => setMobileOpen(false)}>Catalog Piese</Link>
              {categories.map(cat => (
                <Link key={cat.id} to={`/catalog?category=${cat.slug}`} className="text-muted-foreground hover:text-primary py-1" onClick={() => setMobileOpen(false)}>
                  {cat.name}
                </Link>
              ))}
              {user && <Link to="/garage" className="text-secondary-foreground hover:text-primary py-1" onClick={() => setMobileOpen(false)}>Garajul Meu</Link>}
              {user && <Link to="/account" className="text-secondary-foreground hover:text-primary py-1" onClick={() => setMobileOpen(false)}>Contul Meu</Link>}
              {isAdmin && <Link to="/admin" className="text-primary hover:text-primary/80 py-1 font-semibold" onClick={() => setMobileOpen(false)}>Admin</Link>}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
