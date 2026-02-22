import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useClassStore = create(
  persist(
    (set) => ({
      classId: null,
      className: "",
      teacherEmail: "",

      storeClassDetail: (id, name, email) => set({ classId: id, className: name, teacherEmail: email }),
      clearClassDetail: () => set({ classId: null, className: "" }),
    }),
    {
      name: "class-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useClassStore;
