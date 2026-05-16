@echo off
cd /d "C:\Users\Leandro\Documents\taskflow-api"

echo Removing stale git lock...
del .git\HEAD.lock 2>nul
del .git\index.lock 2>nul

echo Staging changes...
git add src/app/page.tsx src/app/globals.css src/app/layout.tsx

echo Committing design improvements...
git commit -m "design: improve logo SVG, gradient title, fix Inter font"

echo Pushing to GitHub...
git push origin main

echo.
echo Done! Vercel will redeploy automatically.
pause
