import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LayoutDashboard, Package, FolderTree, Bike, ShoppingCart, Tag, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();

  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="dashboard"><LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="products"><Package className="w-4 h-4 mr-1" /> Produse</TabsTrigger>
          <TabsTrigger value="categories"><FolderTree className="w-4 h-4 mr-1" /> Categorii</TabsTrigger>
          <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-1" /> Comenzi</TabsTrigger>
          <TabsTrigger value="motos"><Bike className="w-4 h-4 mr-1" /> Moto</TabsTrigger>
          <TabsTrigger value="coupons"><Tag className="w-4 h-4 mr-1" /> Cupoane</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="products"><ProductsTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="motos"><MotosTab /></TabsContent>
        <TabsContent value="coupons"><CouponsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, lowStock: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [ordersRes, productsRes, lowStockRes, recentRes] = await Promise.all([
        supabase.from('orders').select('total'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_qty', 5),
        supabase.from('orders').select('id, status, total, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      
      setStats({
        orders: ordersRes.data?.length || 0,
        revenue: ordersRes.data?.reduce((s: number, o: any) => s + Number(o.total), 0) || 0,
        products: productsRes.count || 0,
        lowStock: lowStockRes.count || 0,
      });
      if (recentRes.data) setRecentOrders(recentRes.data);
    };
    fetch();
  }, []);

  const statCards = [
    { label: 'Comenzi', value: stats.orders, color: 'text-primary' },
    { label: 'Venituri', value: `${stats.revenue.toFixed(0)} RON`, color: 'text-success' },
    { label: 'Produse', value: stats.products, color: 'text-foreground' },
    { label: 'Stoc scăzut', value: stats.lowStock, color: 'text-warning' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-6">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={`font-heading text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <h3 className="font-heading font-bold mb-4">Comenzi recente</h3>
      <div className="space-y-2">
        {recentOrders.map(o => (
          <div key={o.id} className="bg-card rounded border border-border p-3 flex items-center justify-between text-sm">
            <span>#{o.id.slice(0, 8)}</span>
            <span>{o.status}</span>
            <span className="font-bold text-primary">{Number(o.total).toFixed(2)} RON</span>
            <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString('ro-RO')}</span>
          </div>
        ))}
        {recentOrders.length === 0 && <p className="text-muted-foreground text-center py-8">Nu există comenzi.</p>}
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*, brands(name), categories(name)').order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
    supabase.from('categories').select('id, name').order('name').then(({ data }) => { if (data) setCategories(data); });
    supabase.from('brands').select('id, name').order('name').then(({ data }) => { if (data) setBrands(data); });
  }, []);

  const newProduct = () => setEditing({
    name: '', slug: '', sku: '', description: '', price: 0, vat_rate: 19,
    stock_qty: 0, is_oem: false, condition: 'nou', is_active: true,
    brand_id: '', category_id: '',
  });

  const saveProduct = async () => {
    if (!editing) return;
    const data = { ...editing };
    delete data.brands; delete data.categories;
    if (!data.brand_id) data.brand_id = null;
    if (!data.category_id) data.category_id = null;

    if (data.id) {
      const { error } = await supabase.from('products').update(data).eq('id', data.id);
      if (error) { toast.error('Eroare la salvare'); return; }
    } else {
      delete data.id;
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error(error.message); return; }
    }
    toast.success('Produs salvat');
    setEditing(null);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    toast.success('Produs șters');
    fetchProducts();
  };

  if (editing) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 max-w-2xl">
        <h3 className="font-heading font-bold mb-4">{editing.id ? 'Editare produs' : 'Produs nou'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nume</Label>
            <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} />
          </div>
          <div>
            <Label>SKU</Label>
            <Input value={editing.sku} onChange={e => setEditing({ ...editing, sku: e.target.value })} />
          </div>
          <div>
            <Label>Preț (RON)</Label>
            <Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>TVA %</Label>
            <Input type="number" value={editing.vat_rate} onChange={e => setEditing({ ...editing, vat_rate: parseFloat(e.target.value) || 19 })} />
          </div>
          <div>
            <Label>Stoc</Label>
            <Input type="number" value={editing.stock_qty} onChange={e => setEditing({ ...editing, stock_qty: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <Label>Stare</Label>
            <Select value={editing.condition} onValueChange={v => setEditing({ ...editing, condition: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nou">Nou</SelectItem>
                <SelectItem value="sh">SH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Categorie</Label>
            <Select value={editing.category_id || ''} onValueChange={v => setEditing({ ...editing, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select value={editing.brand_id || ''} onValueChange={v => setEditing({ ...editing, brand_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
              <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Descriere</Label>
            <Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.is_oem} onCheckedChange={v => setEditing({ ...editing, is_oem: v })} />
            <Label>OEM</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
            <Label>Activ</Label>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={saveProduct} className="bg-primary text-primary-foreground">Salvează</Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted-foreground">{products.length} produse</span>
        <Button onClick={newProduct} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="p-2">Nume</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Preț</th>
              <th className="p-2">Stoc</th>
              <th className="p-2">Activ</th>
              <th className="p-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2 text-muted-foreground">{p.sku}</td>
                <td className="p-2">{Number(p.price).toFixed(2)} RON</td>
                <td className={`p-2 ${p.stock_qty < 5 ? 'text-warning font-bold' : ''}`}>{p.stock_qty}</td>
                <td className="p-2">{p.is_active ? '✓' : '✗'}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [parentId, setParentId] = useState('');

  const fetch = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };
  useEffect(() => { fetch(); }, []);

  const add = async () => {
    if (!newName || !newSlug) return;
    await supabase.from('categories').insert({ name: newName, slug: newSlug, parent_id: parentId || null });
    toast.success('Categorie adăugată');
    setNewName(''); setNewSlug(''); setParentId('');
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Categorie ștearsă');
    fetch();
  };

  const roots = categories.filter(c => !c.parent_id);

  return (
    <div className="max-w-xl">
      <div className="flex gap-2 mb-6">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nume" />
        <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="Slug" />
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Părinte" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Rădăcină</SelectItem>
            {roots.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={add} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-1">
        {roots.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center justify-between p-2 bg-card rounded border border-border">
              <span className="font-heading font-bold text-sm">{cat.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(cat.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            {categories.filter(c => c.parent_id === cat.id).map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-2 pl-8 text-sm text-muted-foreground">
                <span>↳ {sub.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(sub.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };
  useEffect(() => { fetch(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status: status as any }).eq('id', id);
    toast.success('Status actualizat');
    fetch();
  };

  const statusOptions = ['noua', 'in_procesare', 'expediata', 'anulata', 'finalizata'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="p-2">ID</th>
            <th className="p-2">Data</th>
            <th className="p-2">Total</th>
            <th className="p-2">Status</th>
            <th className="p-2">AWB</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id} className="border-b border-border">
              <td className="p-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
              <td className="p-2">{new Date(o.created_at).toLocaleDateString('ro-RO')}</td>
              <td className="p-2 font-bold text-primary">{Number(o.total).toFixed(2)} RON</td>
              <td className="p-2">
                <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                  <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="p-2">
                <Input
                  defaultValue={o.awb || ''}
                  placeholder="AWB"
                  className="h-8 w-32"
                  onBlur={async e => {
                    if (e.target.value !== (o.awb || '')) {
                      await supabase.from('orders').update({ awb: e.target.value }).eq('id', o.id);
                      toast.success('AWB salvat');
                    }
                  }}
                />
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Nu există comenzi.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MotosTab() {
  const [makes, setMakes] = useState<any[]>([]);
  const [newMake, setNewMake] = useState('');

  const fetch = async () => {
    const { data } = await supabase.from('moto_makes').select('id, name, slug, moto_models(id, name, slug)').order('name');
    if (data) setMakes(data);
  };
  useEffect(() => { fetch(); }, []);

  const addMake = async () => {
    if (!newMake) return;
    const slug = newMake.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await supabase.from('moto_makes').insert({ name: newMake, slug });
    setNewMake('');
    toast.success('Producător adăugat');
    fetch();
  };

  return (
    <div className="max-w-xl">
      <div className="flex gap-2 mb-6">
        <Input value={newMake} onChange={e => setNewMake(e.target.value)} placeholder="Nume producător" />
        <Button onClick={addMake} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Adaugă</Button>
      </div>
      <div className="space-y-3">
        {makes.map(m => (
          <div key={m.id} className="bg-card rounded border border-border p-4">
            <h4 className="font-heading font-bold">{m.name}</h4>
            <div className="mt-2 space-y-1">
              {m.moto_models?.map((mod: any) => (
                <span key={mod.id} className="text-sm text-muted-foreground mr-3">• {mod.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const fetch = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing) return;
    if (editing.id) {
      await supabase.from('coupons').update(editing).eq('id', editing.id);
    } else {
      const { id, ...rest } = editing;
      await supabase.from('coupons').insert(rest);
    }
    toast.success('Cupon salvat');
    setEditing(null);
    fetch();
  };

  if (editing) {
    return (
      <div className="bg-card rounded border border-border p-6 max-w-md">
        <h3 className="font-heading font-bold mb-4">{editing.id ? 'Editare cupon' : 'Cupon nou'}</h3>
        <div className="space-y-3">
          <div><Label>Cod</Label><Input value={editing.code || ''} onChange={e => setEditing({ ...editing, code: e.target.value.toUpperCase() })} /></div>
          <div><Label>Tip</Label>
            <Select value={editing.type || 'percent'} onValueChange={v => setEditing({ ...editing, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="percent">Procent (%)</SelectItem><SelectItem value="fixed">Fix (RON)</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Valoare</Label><Input type="number" value={editing.value || 0} onChange={e => setEditing({ ...editing, value: parseFloat(e.target.value) })} /></div>
          <div><Label>Comandă minimă (RON)</Label><Input type="number" value={editing.min_total || 0} onChange={e => setEditing({ ...editing, min_total: parseFloat(e.target.value) })} /></div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={save} className="bg-primary text-primary-foreground">Salvează</Button>
          <Button variant="outline" onClick={() => setEditing(null)}>Anulează</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setEditing({ code: '', type: 'percent', value: 10, min_total: 0, is_active: true })} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Cupon nou
        </Button>
      </div>
      <div className="space-y-2">
        {coupons.map(c => (
          <div key={c.id} className="bg-card rounded border border-border p-3 flex items-center justify-between text-sm">
            <span className="font-mono font-bold">{c.code}</span>
            <span>{c.type === 'percent' ? `${c.value}%` : `${c.value} RON`}</span>
            <span className={c.is_active ? 'text-success' : 'text-destructive'}>{c.is_active ? 'Activ' : 'Inactiv'}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(c)}><Pencil className="w-3 h-3" /></Button>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-center text-muted-foreground py-8">Nu ai cupoane.</p>}
      </div>
    </div>
  );
}
