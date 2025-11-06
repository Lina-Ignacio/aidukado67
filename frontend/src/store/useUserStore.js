import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      userId: 5,
      userRole: "admin",

      storeUser: (id, role) => set({ userId: id, userRole: role }),
      clearUser: () => set({ userId: null, userRole: "" }),
    }),
    {
      name: "user-storage", // storage key name
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useUserStore;
