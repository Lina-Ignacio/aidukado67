import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useTermStore = create(
  persist(
    (set) => ({
      termId: null,

      storeTerm: (id) => set({ termId: id}),
      clearTerm: () => set({ termId: null}),
    }),
    {
      name: "term-storage", // storage key name
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useTermStore;
