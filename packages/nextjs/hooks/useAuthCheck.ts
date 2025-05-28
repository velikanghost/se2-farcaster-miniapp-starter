import { useApiQuery } from "./useApiQuery";

export const useAuthCheck = () => {
  return useApiQuery({
    url: "/api/auth/check",
    method: "GET",
    isProtected: true,
    queryKey: ["auth-check"],
  });
};
