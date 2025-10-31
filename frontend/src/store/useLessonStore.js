import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const createLessonStore = create(
  persist(
    (set) => ({
      lessonId: null,

      storeLessonId: (id) => set({ lessonId: id }),
      clearLessonId: () => set({ lessonId: null }),
    }),
    {
      name: "lesson-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default createLessonStore;
