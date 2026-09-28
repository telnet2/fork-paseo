import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import type { ComboboxOption } from "@/components/ui/combobox";
import { buildProjectPickerOptions } from "@/components/project-picker-options";
import { getHostProjectSourceDirectory, type HostProjectListItem } from "@/projects/host-projects";
import type { useHostRuntimeClient } from "@/runtime/host-runtime";
import { buildWorkingDirectorySearchRequest, resolveWorkingDirectorySearchPaths } from "@/utils/working-directory-suggestions";

export function useResumeDirectoryPicker(input: {
  projects: readonly HostProjectListItem[];
  selectedServerId: string;
  clientReady: boolean;
  enabled: boolean;
  withConnectedClient: () => NonNullable<ReturnType<typeof useHostRuntimeClient>>;
  t: TFunction;
}) {
  const [openState, setOpenState] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const anchorRef = useRef<View>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const recommendedPaths = useMemo(
    () =>
      input.projects.flatMap((project) => {
        const path = getHostProjectSourceDirectory(project, input.selectedServerId);
        return path ? [path] : [];
      }),
    [input.projects, input.selectedServerId],
  );
  const query = useQuery({
    queryKey: ["new-workspace-resume-directories", input.selectedServerId, debouncedSearchQuery],
    queryFn: async () => {
      const request = buildWorkingDirectorySearchRequest(debouncedSearchQuery);
      const payload = await input.withConnectedClient().getDirectorySuggestions({
        ...request,
        includeDirectories: true,
        includeFiles: false,
        limit: 30,
      });
      return {
        query: debouncedSearchQuery,
        paths: resolveWorkingDirectorySearchPaths(
          request,
          payload.entries?.flatMap((entry) => (entry.kind === "directory" ? [entry.path] : [])) ??
            [],
        ),
      };
    },
    enabled: input.enabled && openState && input.clientReady,
    staleTime: 15_000,
    retry: false,
  });
  const options = useMemo<ComboboxOption[]>(() => {
    const serverPaths = query.data?.query === searchQuery.trim() ? query.data.paths : [];
    return buildProjectPickerOptions({
      recommendedPaths,
      serverPaths,
      query: searchQuery,
    }).map((option) => ({
      id: option.path,
      label: option.path,
      kind: "directory" as const,
    }));
  }, [query.data, recommendedPaths, searchQuery]);

  return {
    anchorRef,
    open: useCallback(() => setOpenState(true), []),
    openState,
    onOpenChange: useCallback((nextOpen: boolean) => {
      setOpenState(nextOpen);
      if (!nextOpen) setSearchQuery("");
    }, []),
    selectedDirectory,
    options,
    onSelect: useCallback((path: string) => {
      setSelectedDirectory(path.trim());
      setOpenState(false);
      setSearchQuery("");
    }, []),
    setSearchQuery,
    emptyText: query.isFetching
      ? input.t("newWorkspace.resume.searching")
      : input.t("newWorkspace.resume.noDirectories"),
    reset: useCallback(() => {
      setSelectedDirectory(null);
      setSearchQuery("");
      setOpenState(false);
    }, []),
  };
}

export type ResumeDirectoryPicker = ReturnType<typeof useResumeDirectoryPicker>;
