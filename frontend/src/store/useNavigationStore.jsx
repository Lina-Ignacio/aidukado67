import { create } from 'zustand';

const useNavigationStore = create((set) => ({
  previousRoute: '/', // default fallback
  
  
  setPreviousRoute: (route) => set({ previousRoute: route }),
  
  
  clearPreviousRoute: () => set({ previousRoute: '/' }),
}));

export default useNavigationStore;