---
title: Workspaces
description: Understand how Paseo groups working directories, agents, terminals, and browsers into workspaces.
nav: Workspaces
order: 10
category: Workspaces
---

# Workspaces

Paseo is organized around workspaces, not chats.

A workspace is the place where a task happens. It has a working directory and can contain multiple sessions running at the same time. In the app, each session opens as a tab.

## Projects contain workspaces

The sidebar starts with projects. A project can be a git repository, a GitHub project, or any directory on a machine running the Paseo daemon.

Inside each project are workspaces. For example:

```
my-app
├── main
├── fix-login-flow
└── redesign-settings
```

Each workspace is a separate place to work. You can keep one for your main checkout, create another for a feature, or open a GitHub PR as another workspace.

Use the [CLI project commands](/docs/cli#projects) to register, list, rename, or delete projects.

## Workspaces contain sessions

Agents run inside a workspace as sessions. A workspace can have one agent session, several agent sessions, terminals, browsers, and diffs open at the same time.

That matters because real development rarely fits into one long chat. You might ask one agent to implement a feature, open a terminal to run a service, start another agent to review the diff, and keep the browser open next to both. Those belong together because they are all part of the same task.

In Paseo, the workspace is the stable container. The sessions are what you run inside it.

## Choose how to start

The New Workspace screen offers three starting modes:

- **Local** uses the selected project's main directory. Use it when sessions should share the files already on disk.
- **New worktree** creates a Paseo-managed git worktree. Enter a branch name to create that exact branch, or leave it empty to let Paseo name the branch from the first prompt.
- **Resume workspace** keeps the selected parent project but uses any existing directory on the selected host as the workspace's working directory. Use it for an existing Git worktree created outside Paseo or another checkout that belongs under the same project.

The workspace is the product concept; a git worktree is one way to isolate its files. More than one workspace can refer to the same managed worktree, and Paseo removes that worktree after its last workspace is archived. A directory opened with **Resume workspace** remains externally owned, so archiving the workspace never removes the directory.

An existing session keeps the working directory it was started with. To work in another directory, select its parent project, create a workspace with **Resume workspace**, and start a new session there. The resumed directory supplies workspace-local `paseo.json` scripts and settings; selecting a parent project controls ownership and sidebar grouping, not config-file inheritance.

## Creating a workspace

You can create a workspace in the app or from the CLI:

```bash
paseo workspace create --isolation local --path ~/dev/my-app --title main
paseo workspace create --isolation worktree --path ~/dev/my-app --base origin/main
```

You can also create a workspace without starting an agent right away. The workspace is still there with its working directory ready; you can open terminals, run services, or browse files, then start an agent later.

Either way, once the workspace exists you can add more sessions to it. Open a terminal alongside an agent, start a second agent to review changes, or open a browser tab to check a local service. Every session lives as a tab inside the same workspace.

Creating an agent and creating a workspace are separate actions. Pass a workspace ID when you want an agent in a specific existing workspace. A bare `paseo run` from a human shell creates a new local workspace; when one agent runs it, Paseo recognizes the caller and creates a subagent in the caller's workspace.

## Worktrees

Every workspace in Paseo is backed by a working directory. When that directory is a git worktree, you get a separate branch and isolated environment for each task.

If you want the details on configuring setup hooks, scripts, and services, continue to [Git worktrees](/docs/worktrees).
