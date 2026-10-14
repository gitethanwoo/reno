export const storage = {
  get: async (key: string) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  set: async (key: string, value: string) => {
    window.localStorage.setItem(key, value);
  },
};
