# Git Structure & How to Push Code

This project is a **monorepo of three separate git repositories**. The root folder
also contains its own git repo, but the actual code lives in nested repos that
each have their **own remote, branch, and history**. You must push each repo
separately.

```
jewellery-walla-upgeaded/          ← ROOT repo (meta/orchestration only)
├── web/          ← OWN git repo → jewellery-wala-frontend
├── api/          ← OWN git repo → jewellery-wala-backend
├── admin-panel/  ← OWN git repo → jewellery-wala-adminpanel
```

---

## Repositories at a glance

| Repo | Local folder | Remote (`origin`) | Branch (currently) |
|------|-------------|-------------------|---------------------|
| Web storefront | `web/` | `https://github.com/jewellerywalaonline-oss/jewellery-wala-frontend.git` | `main` |
| API backend | `api/` | `https://github.com/jewellerywalaonline-oss/jewellery-wala-backend.git` | `main` |
| Admin panel | `admin-panel/` | `https://github.com/jewellerywalaonline-oss/jewellery-wala-adminpanel.git` | `main` |
| Root (meta) | `./` | `origin` → `kidorakart2-lang/kidora-kart` (legacy), `production` → `jewellerywalaonline-oss/jewellery-walla-monorepo.git` | `jewellery-walla-prod` |

> `main` in every repo is the deploy-ready branch and is kept identical to
> `migrated-code` (the active development branch) at release time.

---

## Pushing code (the normal way)

Work and commit **inside the folder of the repo you changed**, then push from
there:

```bash
# Example: you changed something in the web storefront
cd web
git status                                   # see what changed
git add -A
git commit -m "fix: describe the change"
git push origin main                          # main is already checked out
```

Same pattern for `api/` and `admin-panel/`.

If you are not on `main`, switch first:

```bash
git checkout main
```

---

## Releasing development branch into main (force reset)

`main` should always mirror the newest state of `migrated-code`. To reset
`main` to match another branch (fast-forward won't work if histories diverged),
use `--force-with-lease` — it refuses to clobber if someone else pushed in
between:

```bash
git branch -f main migrated-code              # repoint local main
git push origin main --force-with-lease       # force update remote main
git checkout main                             # switch to main
```

Verify the two branches are identical:

```bash
git rev-parse origin/main migrated-code       # both must print the same SHA
```

---

## Pushing from the root repo

The root repo tracks docs, configs, and shared workspace files (not the nested
repos' source, which git ignores as embedded repos). Push it to the production
remote:

```bash
git push production jewellery-walla-prod:test   # dev → test branch for testing
git push production test:main                   # promote to main after testing
```

---

## Quick reference

| Task | Command (run inside the target repo folder) |
|------|---------------------------------------------|
| See changed files | `git status` |
| Commit everything | `git add -A && git commit -m "msg"` |
| Push to main | `git push origin main` |
| Reset main to a branch | `git branch -f main <branch> && git push origin main --force-with-lease` |
| Check branch sync | `git rev-parse origin/main main` |
