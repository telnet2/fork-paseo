import { describe, expect, it } from "vitest";
import {
  buildWorkingDirectorySearchRequest,
  buildWorkingDirectorySuggestions,
  resolveWorkingDirectorySearchPaths,
} from "./working-directory-suggestions";

describe("buildWorkingDirectorySuggestions", () => {
  it("returns de-duplicated recommendations when query is empty", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: ["/Users/me/projects/paseo", "/Users/me/projects/paseo"],
      serverPaths: ["/Users/me/projects/playground"],
      query: "",
    });

    expect(results).toEqual(["/Users/me/projects/paseo"]);
  });

  it("keeps fuzzy recommendation matches before de-duplicated daemon suggestions", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: ["/Users/me/projects/paseo-desktop", "/Users/me/documents"],
      serverPaths: ["/Users/me/projects/paseo-plan", "/Users/me/projects/paseo-desktop"],
      query: "pso",
    });

    expect(results).toEqual(["/Users/me/projects/paseo-desktop", "/Users/me/projects/paseo-plan"]);
  });

  it("does not reinterpret daemon-ranked suggestions", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: [],
      serverPaths: ["/Users/me/projects/paseo-desktop"],
      query: "a-query-ranked-by-the-daemon",
    });

    expect(results).toEqual(["/Users/me/projects/paseo-desktop"]);
  });

  it("matches recommended paths using the complete path text", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: [
        "/Users/me/archive/projects/paseo-desktop",
        "/Users/me/projects/paseo-desktop",
      ],
      serverPaths: [],
      query: "projects/pso",
    });

    expect(results).toEqual([
      "/Users/me/archive/projects/paseo-desktop",
      "/Users/me/projects/paseo-desktop",
    ]);
  });

  it("fuzzy-matches recommended paths using their full path", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: ["/Users/me/projects/blankpage/editor"],
      serverPaths: [],
      query: "blank page editor",
    });

    expect(results).toEqual(["/Users/me/projects/blankpage/editor"]);
  });

  it("treats '~' as an active query and includes daemon suggestions", () => {
    const results = buildWorkingDirectorySuggestions({
      recommendedPaths: ["/Users/me/projects/paseo"],
      serverPaths: ["/Users/me/documents", "/Users/me/projects"],
      query: "~",
    });

    expect(results).toEqual([
      "/Users/me/projects/paseo",
      "/Users/me/documents",
      "/Users/me/projects",
    ]);
  });
});

describe("working directory search requests", () => {
  it("keeps name searches scoped to the daemon home", () => {
    expect(buildWorkingDirectorySearchRequest("paseo")).toEqual({ query: "paseo" });
  });

  it("searches the parent of an absolute POSIX path prefix", () => {
    const request = buildWorkingDirectorySearchRequest("/data00/repos/pas");

    expect(request).toEqual({ cwd: "/data00/repos", query: "pas" });
    expect(resolveWorkingDirectorySearchPaths(request, ["paseo", "paseo-next"])).toEqual([
      "/data00/repos/paseo",
      "/data00/repos/paseo-next",
    ]);
  });

  it("browses children when an absolute directory ends in a slash", () => {
    const request = buildWorkingDirectorySearchRequest("/data00/repos/");

    expect(request).toEqual({ cwd: "/data00/repos", query: "" });
    expect(resolveWorkingDirectorySearchPaths(request, ["paseo"])).toEqual(["/data00/repos/paseo"]);
  });

  it("supports Windows drive paths while accepting slash-normalized results", () => {
    const request = buildWorkingDirectorySearchRequest("C:\\Users\\me\\pro");

    expect(request).toEqual({ cwd: "C:/Users/me", query: "pro" });
    expect(resolveWorkingDirectorySearchPaths(request, ["projects/paseo"])).toEqual([
      "C:/Users/me/projects/paseo",
    ]);
  });
});
