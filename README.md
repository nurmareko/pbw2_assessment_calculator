# Nilai responsi PBW2

Minimal instructor-facing calculator for Assessment 1, Kode D (TelU Pharmacy). Open `index.html` in a browser. No installation, build step, external dependencies, or internet connection is required.

Alternatively, from this folder run `python3 -m http.server 8000` and open http://localhost:8000.

## Usage

1. Enter the student's name and NIM.
2. Choose one of three understanding ratings (0 = Belum paham, 1 = Paham sebagian, 2 = Paham menyeluruh) for each of the 16 rubric items.
3. Read the weighted total out of 100. Unassessed items keep the total provisional; select **Belum dinilai** to clear a rating. An explicit **0** counts as assessed.
4. Click **Unduh Markdown** to download `responsi-<NIM>.md` with the student identity, all rubric scores, completion status and total. Incomplete assessments are labeled provisional. Then use **Reset** for the next student; reset asks for confirmation.

Each item contributes `weight × rating / 2` (0%, 50%, or 100% of the item's weight). Section weights remain 25, 25, 35 and 15, as specified in the PDF. The understanding scale is a proposed instructor aid, not an official final-grade formula or a coding/verbal percentage split.

One current draft is saved in the browser's localStorage. No student data is transmitted anywhere. This is not a permanent gradebook: record results separately before resetting. If browser storage is unavailable, the page displays a warning. The three-level scale uses a separate draft key (`pbw2-responsi-v2`). Old 0–4 drafts remain untouched under the previous key but are not loaded or converted.

## Validation

With Node.js 18 or newer:

```sh
node --test rubric.test.js
node --check app.js
```

The page uses native form controls, responsive layouts and visible keyboard focus. The previous question prompts, notes, CSV export, print controls and decorative UI have been removed to keep grading focused. The CSV helper remains in `rubric.js` for compatibility but is not used by the UI.
