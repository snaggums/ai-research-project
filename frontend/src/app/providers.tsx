import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { createAppQueryClient } from "@/app/query-client";

export function AppProviders({
  children,
  queryClient = createAppQueryClient(),
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
