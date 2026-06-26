import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh across the multi-user workflow without manual reload:
        refetchOnWindowFocus: true,   // refetch when the tab regains focus
        refetchOnMount: "always",     // refetch every time a page mounts
        refetchOnReconnect: true,     // refetch after network reconnect
        staleTime: 10_000,            // treat data as fresh for 10s to avoid thrashing
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
