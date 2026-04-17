@echo off
chcp 65001

cd /d D:\path\to\repo

for /f "delims=" %%i in (myanimelist.txt) do set last=%%i

git add myanimelist.txt
git commit -m "%last%"
git push

pause