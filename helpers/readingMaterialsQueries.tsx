import { useQuery } from "@tanstack/react-query";
import { getMaterials, InputType as GetMaterialsInputType } from "../endpoints/materials_GET.schema";
import { postMaterialsRead, InputType as PostMaterialsReadInputType } from "../endpoints/materials/read_POST.schema";

/**
 * React Query hook to fetch a list of reading materials.
 * @param filters Optional filters for readingLevel and contentType.
 */
export const useMaterials = (filters?: GetMaterialsInputType) => {
  const queryKey = ['materials', filters];
  return useQuery({
    queryKey,
    queryFn: () => getMaterials(filters),
  });
};

/**
 * React Query hook to fetch a single reading material by its ID.
 * @param id The ID of the material to fetch. Hook is disabled if id is null/undefined.
 */
export const useMaterial = (id: number | null | undefined) => {
  const queryKey = ['material', id];
  return useQuery({
    queryKey,
    queryFn: () => {
      if (!id) {
        // This should not happen due to the `enabled` flag, but as a safeguard:
        return Promise.reject(new Error("Material ID is required."));
      }
      return postMaterialsRead({ id });
    },
    enabled: !!id, // The query will not run until the id is available
  });
};