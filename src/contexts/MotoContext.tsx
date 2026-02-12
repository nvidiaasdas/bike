import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MotoSelection {
  makeId?: string;
  makeName?: string;
  modelId?: string;
  modelName?: string;
  variantId?: string;
  variantLabel?: string;
}

interface MotoContextType {
  selected: MotoSelection | null;
  setSelected: (s: MotoSelection | null) => void;
  clearSelection: () => void;
}

const MotoContext = createContext<MotoContextType | undefined>(undefined);

export function MotoProvider({ children }: { children: ReactNode }) {
  const [selected, setSelectedState] = useState<MotoSelection | null>(() => {
    const saved = localStorage.getItem('moto_selection');
    return saved ? JSON.parse(saved) : null;
  });

  const setSelected = (s: MotoSelection | null) => {
    setSelectedState(s);
    if (s) {
      localStorage.setItem('moto_selection', JSON.stringify(s));
    } else {
      localStorage.removeItem('moto_selection');
    }
  };

  const clearSelection = () => setSelected(null);

  return (
    <MotoContext.Provider value={{ selected, setSelected, clearSelection }}>
      {children}
    </MotoContext.Provider>
  );
}

export function useMoto() {
  const context = useContext(MotoContext);
  if (!context) throw new Error('useMoto must be used within MotoProvider');
  return context;
}
