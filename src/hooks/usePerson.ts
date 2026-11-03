// src/hooks/usePerson.ts
import { useQuery } from "@tanstack/react-query"
import { fetchPerson } from "../utils/api"

// A person and their filmography (pages/PersonPage.tsx)
export const usePerson = (id: number) =>
  useQuery({
    queryKey: ["person", id],
    queryFn: () => fetchPerson(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 60,
  })
