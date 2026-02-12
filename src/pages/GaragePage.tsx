import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bike, Plus, Star, Trash2 } from 'lucide-react';

const SUPABASE_URL = 'https://cgboawjncqqasijhqgkv.supabase.co';
const API_KEY = 'sb_publishable_3w5FPK8BTYy6JQIuzHcFVA_rWVwrt5_';

interface GarageItem {
  id: string;
  nickname: string | null;
  is_default: boolean;
  moto_variants: {
    id: string; year_from: number; year_to: number | null; engine: string; trim: string;
    moto_models: { name: string; moto_makes: { name: string } };
  };
}

function GarageBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-medium ${className}`}>{children}</span>;
}

export default function GaragePage() {
  const { user, session } = useAuth();
  const [garage, setGarage] = useState<GarageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [nickname, setNickname] = useState('');

  const headers = {
    'apikey': API_KEY,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    // Fetch makes via REST API
    fetch(`${SUPABASE_URL}/rest/v1/moto_makes?order=name.asc`, { headers })
      .then(r => r.json())
      .then(data => { if (data) setMakes(data); })
      .catch(err => console.error('Makes error:', err));
  }, []);

  useEffect(() => {
    if (!makeId) { setModels([]); setModelId(''); return; }
    // Fetch models via REST API
    fetch(`${SUPABASE_URL}/rest/v1/moto_models?make_id=eq.${makeId}&order=name.asc`, { headers })
      .then(r => r.json())
      .then(data => { if (data) setModels(data); })
      .catch(err => console.error('Models error:', err));
    setModelId(''); setVariantId('');
  }, [makeId]);

  useEffect(() => {
    if (!modelId) { setVariants([]); setVariantId(''); return; }
    // Fetch variants via REST API
    fetch(`${SUPABASE_URL}/rest/v1/moto_variants?model_id=eq.${modelId}&order=year_from.asc`, { headers })
      .then(r => r.json())
      .then(data => { if (data) setVariants(data); })
      .catch(err => console.error('Variants error:', err));
    setVariantId('');
  }, [modelId]);

  const fetchGarage = async () => {
    if (!user || !session) return;
    try {
      const authHeaders = {
        ...headers,
        'Authorization': `Bearer ${session.access_token}`,
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_garage?user_id=eq.${user.id}&order=created_at.asc`, { headers: authHeaders });
      const garageData = await response.json();

      if (garageData && Array.isArray(garageData)) {
        // Fetch variant details for each garage item
        const variantIds = garageData.map((g: any) => g.moto_variant_id);
        if (variantIds.length > 0) {
          const variantsRes = await fetch(`${SUPABASE_URL}/rest/v1/moto_variants?id=in.(${variantIds.join(',')})`, { headers });
          const variantsData = await variantsRes.json();

          // Fetch models
          const modelIds = variantsData.map((v: any) => v.model_id);
          const modelsRes = await fetch(`${SUPABASE_URL}/rest/v1/moto_models?id=in.(${modelIds.join(',')})`, { headers });
          const modelsData = await modelsRes.json();

          // Fetch makes
          const makeIds = modelsData.map((m: any) => m.make_id);
          const makesRes = await fetch(`${SUPABASE_URL}/rest/v1/moto_makes?id=in.(${makeIds.join(',')})`, { headers });
          const makesData = await makesRes.json();

          // Build garage items with full data
          const fullGarage = garageData.map((g: any) => {
            const variant = variantsData.find((v: any) => v.id === g.moto_variant_id);
            const model = modelsData.find((m: any) => m.id === variant?.model_id);
            const make = makesData.find((mk: any) => mk.id === model?.make_id);

            return {
              id: g.id,
              nickname: g.nickname,
              is_default: g.is_default,
              moto_variants: {
                id: variant?.id,
                year_from: variant?.year_from,
                year_to: variant?.year_to,
                engine: variant?.engine,
                trim: variant?.trim,
                moto_models: {
                  name: model?.name,
                  moto_makes: { name: make?.name },
                },
              },
            };
          });

          setGarage(fullGarage as any);
        }
      }
    } catch (err) {
      console.error('Garage fetch error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGarage(); }, [user, session]);

  if (!user) return <Navigate to="/auth" />;

  const addMoto = async () => {
    if (!variantId) {
      toast.error('Te rog selectează o variantă');
      return;
    }
    setSubmitting(true);
    console.log('Starting addMoto...', { user_id: user?.id, moto_variant_id: variantId, nickname });

    try {
      const { data, error } = await supabase.from('user_garage').insert({
        user_id: user.id,
        moto_variant_id: variantId,
        nickname: nickname || null,
        is_default: garage.length === 0,
      });

      console.log('Insert response:', { data, error });

      if (error) {
        console.error('Supabase insert error:', error);
        toast.error(`Eroare la adăugare: ${error.message}`);
        setSubmitting(false);
        return;
      }

      console.log('Moto added successfully');
      toast.success('Motocicleta a fost adăugată!');

      // Reset form
      setAdding(false);
      setMakeId('');
      setModelId('');
      setVariantId('');
      setNickname('');

      // Refresh the garage list without waiting too long
      console.log('Refreshing garage...');
      setLoading(true);
      fetchGarage().catch(err => {
        console.error('Garage refresh error:', err);
        setLoading(false);
      });

      setSubmitting(false);
    } catch (err: any) {
      console.error('Add moto exception:', err);
      toast.error(`Eroare: ${err.message}`);
      setSubmitting(false);
    }
  };

  const setDefault = async (id: string) => {
    await supabase.from('user_garage').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('user_garage').update({ is_default: true }).eq('id', id);
    toast.success('Motocicleta implicită a fost actualizată!');
    fetchGarage();
  };

  const deleteMoto = async (id: string) => {
    await supabase.from('user_garage').delete().eq('id', id);
    toast.success('Motocicleta a fost eliminată!');
    fetchGarage();
  };

  if (loading) return <div className="container py-12"><div className="bg-muted animate-pulse h-96 rounded-lg" /></div>;

  return (
    <div className="container py-8">
      <h1 className="font-heading text-3xl font-bold mb-8 flex items-center gap-2">
        <Bike className="w-8 h-8 text-primary" /> Garajul Meu
      </h1>

      {garage.length > 0 && (
        <div className="mb-8 space-y-3">
          {garage.map((item) => (
            <div key={item.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-heading font-bold">{item.moto_variants.moto_models.moto_makes.name} {item.moto_variants.moto_models.name}</p>
                <p className="text-sm text-muted-foreground">
                  {item.moto_variants.year_from}-{item.moto_variants.year_to || 'prezent'} • {item.moto_variants.engine} • {item.moto_variants.trim}
                </p>
                {item.nickname && <p className="text-sm text-muted-foreground italic mt-1">{item.nickname}</p>}
              </div>
              <div className="flex items-center gap-2">
                {item.is_default && <GarageBadge className="bg-success/20 text-success">● Implicita</GarageBadge>}
                {!item.is_default && <Button variant="ghost" size="sm" onClick={() => setDefault(item.id)}><Star className="w-4 h-4 mr-1" />Alege</Button>}
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMoto(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <Button onClick={() => setAdding(true)} className="bg-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Adaugă motocicleta</Button>
      ) : (
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Producător</Label>
              <Select value={makeId} onValueChange={setMakeId}>
                <SelectTrigger><SelectValue placeholder="Producător" /></SelectTrigger>
                <SelectContent>{makes.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Select value={modelId} onValueChange={setModelId} disabled={!makeId}>
                <SelectTrigger><SelectValue placeholder="Model" /></SelectTrigger>
                <SelectContent>{models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motor / An</Label>
              <Select value={variantId} onValueChange={setVariantId} disabled={!modelId}>
                <SelectTrigger><SelectValue placeholder="Motor / An" /></SelectTrigger>
                <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.engine} {v.year_from}-{v.year_to || 'prezent'}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Porecla (opțional)</Label>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="ex: Motocicleta de vară" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addMoto}
              disabled={!variantId || submitting}
              className="bg-primary text-primary-foreground"
            >
              {submitting ? 'Se adaugă...' : 'Adaugă'}
            </Button>
            <Button
              onClick={() => {
                setAdding(false);
                setMakeId('');
                setModelId('');
                setVariantId('');
                setNickname('');
              }}
              variant="outline"
              disabled={submitting}
            >
              Anulează
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
