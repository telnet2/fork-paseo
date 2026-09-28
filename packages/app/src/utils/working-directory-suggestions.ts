import { scorePathMatch } from "@getpaseo/protocol/search/text-match";

export interface BuildWorkingDirectorySuggestionsInput {
  recommendedPaths: string[];
  serverPaths: string[];
  query: string;
}

export interface WorkingDirectorySearchRequest {
  query: string;
  cwd?: string;
}

// Home-scoped search is appropriate for a name query. An absolute path prefix
// needs to search its parent directory instead, because that path may live
// outside the daemon user's home (for example /data00/repos/pa).
export function buildWorkingDirectorySearchRequest(query: string): WorkingDirectorySearchRequest {
  const normalized = query.trim().replace(/\\/g, "/");
  if (!isAbsoluteDirectoryQuery(normalized)) return { query: normalized };

  const withoutTrailingSlash = stripTrailingSlash(normalized);
  if (withoutTrailingSlash !== normalized || isAbsoluteRoot(normalized)) {
    return { cwd: withoutTrailingSlash, query: "" };
  }

  const separator = normalized.lastIndexOf("/");
  return {
    cwd: absoluteParent(normalized, separator),
    query: normalized.slice(separator + 1),
  };
}

export function resolveWorkingDirectorySearchPaths(
  request: WorkingDirectorySearchRequest,
  serverPaths: string[],
): string[] {
  if (!request.cwd) return serverPaths;
  return serverPaths.map((serverPath) => joinRemotePath(request.cwd!, serverPath));
}

export function buildWorkingDirectorySuggestions(
  input: BuildWorkingDirectorySuggestionsInput,
): string[] {
  const query = input.query.trim();
  const recommended = uniquePaths(input.recommendedPaths);
  if (!query) {
    return recommended;
  }

  const matchingRecommended = recommended.filter((path) =>
    recommendedPathMatchesQuery(path, query),
  );

  // Server paths are already ranked by the daemon. Recommended paths use the
  // same shared matcher, then keep their existing recommendation order.
  return uniquePaths([...matchingRecommended, ...input.serverPaths]);
}

function uniquePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const path of paths) {
    const trimmed = path.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    ordered.push(trimmed);
  }
  return ordered;
}

function recommendedPathMatchesQuery(path: string, query: string): boolean {
  const candidate = normalizePath(path);
  const normalizedQuery = normalizePath(query);
  if (["~", "~/"].includes(normalizedQuery)) {
    return true;
  }

  return scorePathMatch(normalizedQuery, candidate) !== null;
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, "/").toLowerCase();
}

function isAbsoluteDirectoryQuery(query: string): boolean {
  return query.startsWith("/") || /^[a-zA-Z]:\//.test(query);
}

function stripTrailingSlash(query: string): string {
  if (isAbsoluteRoot(query)) return query;
  return query.replace(/\/+$/, "");
}

function isAbsoluteRoot(query: string): boolean {
  return query === "/" || /^[a-zA-Z]:\/$/.test(query);
}

function absoluteParent(query: string, separator: number): string {
  if (separator === 0) return "/";
  if (/^[a-zA-Z]:\//.test(query) && separator === 2) return query.slice(0, 3);
  return query.slice(0, separator);
}

function joinRemotePath(parent: string, child: string): string {
  if (isAbsoluteDirectoryQuery(child)) return child;
  if (child === ".") return parent;
  return `${parent.replace(/\/+$/, "")}/${child.replace(/^\/+/, "")}`;
}
