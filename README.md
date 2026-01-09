# Brevoza CMS
---
A Next JS web app that will read the brevoza.config.yml file of a GitHub repo and display an editor specific to that schema to create/edit/delete items in a collection.  

you must install the github app brevoza-cms (https://github.com/apps/brevoza-cms) to your account and allow it access to your repo you want connected.



# how it works

if i want the github project https://github.com/brevoza/jonny-jackson-projects edited, i need to go to 
https://brevoza-cms.vercel.app/brevoza/jonny-jackson-projects

Brevoza will search this git repo for a brevoza.config.yml file, then see what collections are defined. 


In this case, it's just the projects collection, who's config file is located at projects-config.yml.

an example brevoza.config.yml file:
```
collections:
  projects:
    config: projects-config.yml
```
Then, brevoza will find the *collection's* config file to see *it's* schema.

projects-config.yml:
```
collection: projects
description: >
  Jonny Jacksons portfolio projects

storage:
  path: projects/
  format: json
  idField: id

schema:
  type: object
  required:
    - id
    - title

  properties:
    id:
      type: string
      description: Unique slug identifier

    title:
      type: string

    description:
      type: string

    coverImage:
      type: image

    body:
      type: markdown
```
As you can see, each project has a title (string), description (string), coverImage (image), and body (markdown).
And because of this:
```
storage:
  path: projects/
  format: json
```
We know that each project is stored as a json file in the projects/ directory.
If we want to create a new project item in the projects collection, we must create a new file in the /projects directory.














# dev

```
cd brevoza-cms
npm run dev
```





eventually, ill need to list on marketplace https://github.com/settings/apps/brevoza-cms and go over permissions

