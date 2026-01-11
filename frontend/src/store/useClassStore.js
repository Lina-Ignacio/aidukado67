import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useClassStore = create(
  persist(
    (set) => ({
      classId: null,
      className: "",

      storeClassDetail: (id, name) => set({ classId: id, className: name }),
      clearClassDetail: () => set({ classId: null, className: "" }),
    }),
    {
      name: "class-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useClassStore;
