@echo off
cd /d "C:\Users\Leandro\Documents\taskflow-api"

echo Removing stale git locks...
del .git\HEAD.lock 2>nul
del .git\index.lock 2>nul

echo Staging all changes...
git add src/app/page.tsx src/app/studio/page.tsx src/app/explorer/page.tsx src/app/globals.css src/app/layout.tsx src/app/api/auth/register/route.ts next.config.ts

echo Committing...
git commit -m "design: SVG logo all pages, gradient title, Inter font, iframe headers, better errors"

echo Pushing to GitHub...
git push origin main

echo.
echo Done! Vercel will redeploy in ~1 min.
pause
