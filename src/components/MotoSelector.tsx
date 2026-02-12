import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMoto } from '@/contexts/MotoContext';
import { Bike, Search } from 'lucide-react';

interface Make { id: string; name: string; slug: string }
interface Model { id: string; name: string; slug: string }
interface Variant { id: string; year_from: number; year_to: number | null; engine: string; trim: string }

interface Props {
  onSelected?: () => void;
  compact?: boolean;
}

export default function MotoSelector({ onSelected, compact }: Props) {
  const { setSelected } = useMoto();
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [variantId, setVariantId] = useState('');

  useEffect(() => {
    supabase.from('moto_makes').select('id, name, slug').order('name').then(({ data }) => {
      if (data) setMakes(data);
    });
  }, []);

  useEffect(() => {
    if (!makeId) { setModels([]); setModelId(''); return; }
    supabase.from('moto_models').select('id, name, slug').eq('make_id', makeId).order('name').then(({ data }) => {
      if (data) setModels(data);
    });
    setModelId('');
    setVariantId('');
  }, [makeId]);

  useEffect(() => {
    if (!modelId) { setVariants([]); setVariantId(''); return; }
    supabase.from('moto_variants').select('id, year_from, year_to, engine, trim').eq('model_id', modelId).order('year_from').then(({ data }) => {
      if (data) setVariants(data);
    });
    setVariantId('');
  }, [modelId]);

  const handleApply = () => {
    const make = makes.find(m => m.id === makeId);
    const model = models.find(m => m.id === modelId);
    const variant = variants.find(v => v.id === variantId);
    
    if (make && model && variant) {
      setSelected({
        makeId: make.id,
        makeName: make.name,
        modelId: model.id,
        modelName: model.name,
        variantId: variant.id,
        variantLabel: `${variant.year_from}-${variant.year_to || 'prezent'} ${variant.engine} ${variant.trim}`,
      });
      onSelected?.();
    }
  };

  const containerClass = compact
    ? 'flex flex-wrap items-end gap-2'
    : 'bg-card rounded-lg p-6 border border-border shadow-sm';

  return (
    <div className={containerClass}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Bike className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-lg font-bold">Selectează motocicleta</h3>
        </div>
      )}
      
      <div className={compact ? 'flex flex-wrap gap-2 items-end' : 'grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4'}>
        <div>
          {!compact && <label className="text-sm text-muted-foreground mb-1 block">Producător</label>}
          <Select value={makeId} onValueChange={setMakeId}>
            <SelectTrigger className={compact ? 'w-[140px]' : ''}>
              <SelectValue placeholder="Producător" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={4}>
              {makes.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          {!compact && <label className="text-sm text-muted-foreground mb-1 block">Model</label>}
          <Select value={modelId} onValueChange={setModelId} disabled={!makeId}>
            <SelectTrigger className={compact ? 'w-[140px]' : ''}>
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={4}>
              {models.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          {!compact && <label className="text-sm text-muted-foreground mb-1 block">Motor / An</label>}
          <Select value={variantId} onValueChange={setVariantId} disabled={!modelId}>
            <SelectTrigger className={compact ? 'w-[200px]' : ''}>
              <SelectValue placeholder="Motor / An" />
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={4}>
              {variants.map(v => (
                <SelectItem key={v.id} value={v.id}>
                 {v.engine} {v.trim} {v.year_from}-{v.year_to || 'prezent'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleApply} disabled={!variantId} className="bg-primary text-primary-foreground hover:bg-primary/90">
        <Search className="w-4 h-4 mr-2" />
        {compact ? 'Aplică' : 'Caută piese compatibile'}
      </Button>
    </div>
  );
}
