import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      userId: null,
      userRole: "",
      email: "",
      firstName: "",

      storeUser: (id, role, userEmail, firstName ) => set({ userId: id, userRole: role, email: userEmail, firstName: firstName }),
      clearUser: () => set({ userId: null, userRole: "", email: "", first_name: "" }),
    }),
    {
      name: "user-storage", 
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;