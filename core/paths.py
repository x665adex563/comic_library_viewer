import os
import sys
from urllib.parse import quote


if getattr(sys, "frozen", False):
    SCRIPT_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

OUTPUT_ROOT = os.path.join(SCRIPT_DIR, "_comic_viewer_output")
os.makedirs(OUTPUT_ROOT, exist_ok=True)


def html_safe_path(target_path, html_file):
    """計算 HTML 中引用 target_path 的安全路徑，支援跨磁碟槽"""
    target_abs = os.path.abspath(target_path)
    html_abs = os.path.abspath(html_file)

    from_drive = os.path.splitdrive(html_abs)[0]
    to_drive = os.path.splitdrive(target_abs)[0]

    if from_drive.lower() == to_drive.lower():
        rel = os.path.relpath(
            target_abs, start=os.path.dirname(html_abs)
        ).replace("\\", "/")
        return quote(rel)
    else:
        return "file:///" + quote(target_abs.replace("\\", "/"))
