# Task 1 – Deployment Record

## Deployment details

| Item | Value |
|---|---|
| Name of the web application | Shelfmark – Book Management System |
| Hosting platform or server used | _e.g. Render (backend + frontend) / GitHub Pages (frontend) + Render (API)_ |
| Deployed URL or IP address | _https://…_ |
| API URL (if separate) | _https://…/api/health_ |
| Date of deployment | _YYYY-MM-DD_ |
| Repository | _https://github.com/USERNAME/REPO_ |
| Deployed by | _your name_ |

## Post-deployment test checklist

Open the deployed URL in a fresh browser tab and test each feature. Mark Pass or Fail and note anything unexpected.

| # | Feature | How to test | Expected result | Result |
|---|---|---|---|---|
| 1 | Page loads | Open the URL | Shelf of books appears, no console errors | |
| 2 | Server connection | Look at the top-right status | "Connected to server" (or "Demo mode" if Option C) | |
| 3 | Summary figures | Read the heading and figures | Totals match the number of books | |
| 4 | Add book | Add book, fill title and author, Save | Toast "Book added", book appears on the shelf | |
| 5 | Validation | Add book, leave title empty, Save | "Enter a title." shown, nothing saved | |
| 6 | Edit book | Click a spine, change title, Save | Toast "Book saved", title updated | |
| 7 | Delete book | Click a spine, Delete book twice (confirm) | Toast "Book deleted", spine removed | |
| 8 | Search | Type part of a title or author | Only matching books remain | |
| 9 | Status tabs | Click Reading, Want to read, Finished | List filters correctly | |
| 10 | Genre filter and sort | Pick a genre; change Sort by | Results filter and reorder | |
| 11 | List view | Click List | Table with Edit buttons | |
| 12 | Persistence | Reload the page | Added or edited books are still there | |
| 13 | Mobile layout | Open on a phone or resize to 390 px wide | No sideways scrolling; controls usable | |
| 14 | API health | Visit `/api/health` (Options A/B) | `{"ok":true,…}` | |

## Issues found and fixes

_Describe any problems found during testing and how you fixed them (for example CORS errors, wrong API_BASE, Render cold start)._
