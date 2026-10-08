# Browser end-to-end tests

Drive the real UI in Microsoft Edge (Playwright) with a fake camera, against running servers
(`uvicorn` on :8000 and `npm run dev` on :5173). The journey script covers registration,
profile, ID capture and verification, device check, a live interview with gaze and environment
monitoring, ending, report generation and every report section. The failure script covers a
profile photo without a face, an unreadable ID, interview creation before verification, and
camera permission denied. Screenshots go to `<workdir>/shots`.

```powershell
python -m venv .e2e; .e2e\Scripts\pip install playwright opencv-python-headless numpy
# fixtures from your own media (an interview-style video with one person, and an ID image):
..\..\trustpro_backend\.venv\Scripts\python make_fixtures.py C:\temp\tp-e2e interview.mp4 id_card.jpg
.e2e\Scripts\python e2e_journey.py  C:\temp\tp-e2e 40     # 40 s live interview
.e2e\Scripts\python e2e_failures.py C:\temp\tp-e2e
```
