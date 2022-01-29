===============================
=====CREATE NEW HEROKU APP=====
===============================

1. Create git remote.

If you have a heroku app already:
heroku git:remote -a <heroku app name>

Otherwise:
heroku create

2. Use procfile.  In heroku dashboard, go to the heroku project, then resources, 
then disable web and enable worker.

3. Create database. 
heroku addons:create heroku-postgresql:hobby-dev

4. Set environment variables. Don't set DATABASE_URL as that's automatic on heroku.
heroku config:set <key>=<value>

5. Deploy to heroku:

deploy main:
git push heroku main

deploy branch:
git push heroku <branch>:main