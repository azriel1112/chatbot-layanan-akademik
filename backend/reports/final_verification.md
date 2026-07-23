# Final Verification Report

**Status akhir: BELUM LULUS**

- Check lulus: **10**
- Check gagal: **1**

## Hasil Pemeriksaan

| No. | Pemeriksaan | Status | Detail |
|---:|---|---|---|
| 1 | Runtime assets | PASS | 300 FAQ dan 13 intent tersedia. |
| 2 | Dataset intent | PASS | 327 utterance dan 13 intent divalidasi dari C:\Users\afif.ramadhan\OneDrive - PCMan\Documents\College\Semester 8\Natural Language Processing\chatbot-layanan-akademik\backend-node\data\intent_dataset.csv. |
| 3 | Evaluasi model | PASS | Accuracy 92.54% dan macro F1 91.41% tersedia. |
| 4 | Git merge markers | FAIL | ValueError: Git merge marker masih ditemukan: venv\Lib\site-packages\_pytest\hookspec.py:67, venv\Lib\site-packages\_pytest\hookspec.py:90, venv\Lib\site-packages\_pytest\hookspec.py:131, venv\Lib\site-packages\_pytest\hookspec.py:150, venv\Lib\site-packages\_pytest\hookspec.py:182, venv\Lib\site-packages\_pytest\hookspec.py:199, venv\Lib\site-packages\_pytest\hookspec.py:218, venv\Lib\site-packages\_pytest\hookspec.py:265, venv\Lib\site-packages\_pytest\hookspec.py:287, venv\Lib\site-packages\_pytest\hookspec.py:299, venv\Lib\site-packages\_pytest\hookspec.py:339, venv\Lib\site-packages\_pytest\hookspec.py:369, venv\Lib\site-packages\_pytest\hookspec.py:405, venv\Lib\site-packages\_pytest\hookspec.py:422, venv\Lib\site-packages\_pytest\hookspec.py:437, venv\Lib\site-packages\_pytest\hookspec.py:451, venv\Lib\site-packages\_pytest\hookspec.py:474, venv\Lib\site-packages\_pytest\hookspec.py:491, venv\Lib\site-packages\_pytest\hookspec.py:534, venv\Lib\site-packages\_pytest\hookspec.py:560 |
| 5 | Dokumentasi final | PASS | README, dokumentasi API, skenario demo, dan checklist UAS tersedia. |
| 6 | Health endpoint | PASS | HTTP 200; 300 FAQ, 13 intent, framework Flask. |
| 7 | Direct FAQ answer | PASS | FAQ pembayaran ditemukan: Bagaimana cara membayar biaya kuliah Universitas Mercu Buana? |
| 8 | Out-of-domain handling | PASS | Pertanyaan luar domain ditolak dengan aman. |
| 9 | Multi-turn dan konfirmasi | PASS | Empat turn berhasil sampai final_answer terkonfirmasi. |
| 10 | Reset session | PASS | Endpoint reset session mengembalikan HTTP 200. |
| 11 | Conversation logging | PASS | 6 turn, 3 session, no-match 1, confirmed 1. |

## Catatan

Frontend production build diperiksa melalui script `scripts/verify_all.sh` atau `scripts/verify_all.ps1`, karena proses tersebut membutuhkan Node.js dan npm.
