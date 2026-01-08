# Brevoza CMS
---
A Next JS web app that will read the brevoza.config.yml file of a GitHub repo and display an editor specific to that schema to create/edit/delete items in a collection.  




```
cd brevoza-cms
npm run dev
```

.env file:
```
REPO_OWNER=brevoza
REPO_NAME=jonny-jackson-projects
REPO_BRANCH=main
```

it reads REPO_OWNER, REPO_NAME, and optional REPO_BRANCH from .env and finds that github repo's brevoza.config.yml.
