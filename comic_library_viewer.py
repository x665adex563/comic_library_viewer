# 網頁一頁式漫畫瀏覽v3（搜尋欄）
import json
import os
import re
import sys
import webbrowser
from dataclasses import asdict, dataclass
from tkinter import Tk, filedialog
from urllib.parse import quote


IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")

@dataclass
class ViewerItem:
    name: str
    path: str
    images: list[str]
    type: str
    link: str = ""
    thumb: str = ""

# --------------------
# 執行檔位置 & 統一輸出資料夾
# --------------------
if getattr(sys, 'frozen', False):
    SCRIPT_DIR = os.path.dirname(os.path.abspath(sys.executable))
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_ROOT = os.path.join(SCRIPT_DIR, "_comic_viewer_output")
os.makedirs(OUTPUT_ROOT, exist_ok=True)

TEMPLATE_DIR = os.path.join(SCRIPT_DIR, "templates")
INDEX_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "index.html")


def load_index_template():
    with open(INDEX_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

# --------------------
# 自然排序
# --------------------
def natural_sort_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'([0-9]+)', s)]

# --------------------
# 相對路徑 + URL 編碼
# --------------------
def html_safe_path(target_path, html_file):
    """計算 HTML 中引用 target_path 的安全路徑，支援跨磁碟槽"""
    target_abs = os.path.abspath(target_path)
    html_abs = os.path.abspath(html_file)
    
    from_drive = os.path.splitdrive(html_abs)[0]
    to_drive = os.path.splitdrive(target_abs)[0]

    if from_drive.lower() == to_drive.lower():
        # 同磁碟槽 → 相對路徑
        rel = os.path.relpath(target_abs, start=os.path.dirname(html_abs)).replace("\\", "/")
        return quote(rel)
    else:
        # 不同磁碟槽 → file:/// 絕對路徑
        return "file:///" + quote(target_abs.replace("\\", "/"))


# --------------------
# 掃描漫畫目錄
# --------------------
def scan_directory(folder):
    subdirs = sorted(
        [
            d
            for d in os.listdir(folder)
            if os.path.isdir(os.path.join(folder, d))
        ],
        key=natural_sort_key
    )

    items = []

    for d in subdirs:
        d_path = os.path.join(folder, d)

        images = sorted(
            [
                f
                for f in os.listdir(d_path)
                if f.lower().endswith(IMAGE_EXTS)
            ],
            key=natural_sort_key
        )

        if images:
            item = ViewerItem(
                name=d,
                path=d_path,
                images=images,
                type="image"
            )
        else:
            item = ViewerItem(
                name=d,
                path=d_path,
                images=[],
                type="folder"
            )

        items.append(item)

    return items

# --------------------
# 單話漫畫頁
# --------------------
def generate_chapter_html(folder, viewer_folder, parent_index_html):
    images = sorted(
        [f for f in os.listdir(folder) if f.lower().endswith(IMAGE_EXTS)],
        key=natural_sort_key
    )

    folder_name = os.path.basename(folder)
    html_file = os.path.join(viewer_folder, f"{folder_name}.html")

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>{folder_name}</title>
<style>
body {{
  margin:0;
  background:#000;
  overflow-x: hidden;
}}
img {{
  display:block;
  max-width:100vw;
  height: auto;
  margin: 0 auto;
}}
#back {{
  position:fixed;
  top:20px;
  left:20px;
}}
#back a {{
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 50px 50px;
  background: #000000;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 20px;
  opacity: 0.1;
  transition: opacity 0.25s ease, background 0.25s ease;
}}
#back:hover a {{
  opacity: 1;
  background: #222222;
}}
</style>
</head>
<body>
""")
        if parent_index_html:
            f.write('<div id="back"><a href="javascript:history.back()">←</a></div>\n')

        for img in images:
            f.write(f'<img src="{html_safe_path(os.path.join(folder, img), html_file)}">\n')

        f.write("</body></html>\n")

    return html_file

# --------------------
# 目錄頁
# --------------------
def generate_index_html(folder, viewer_folder, index_name, parent_index_html=None, all_items=None):
    if all_items is None:
        all_items = []

    html_file = os.path.join(viewer_folder, index_name)
    folder_name = os.path.basename(folder)

    template = load_index_template()
    template = template.replace("{{TITLE}}", folder_name)

    if parent_index_html:
        back_button_html = (
            f'<div id="back">'
            f'<a href="{html_safe_path(parent_index_html, html_file)}">←</a>'
            f'</div>'
        )
    else:
        back_button_html = ""

    items = scan_directory(folder)

    items_html = ""
    
    for item in items:
        d_path = item.path

        if item.type == "image":
            chapter_html = generate_chapter_html(
                d_path,
                viewer_folder,
                html_file
            )

            link = quote(os.path.basename(chapter_html))
            thumb = html_safe_path(
                os.path.join(d_path, item.images[0]),
                chapter_html
            )

            item.link = link
            item.thumb = thumb

        else:
            sub_index = f"{item.name}.html"

            generate_index_html(
                d_path,
                viewer_folder,
                sub_index,
                html_file,
                all_items
            )

            item.link = quote(sub_index)
            item.thumb = ""

        all_items.append(item)

        thumb_html = (
            f'<img class="thumb-img" src="{item.thumb}">'
            if item.type == "image"
            else '<div class="folder-thumb">📁</div>'
        )

        items_html += (
            f'<li><a href="{item.link}">'
            f'{thumb_html}'
            f'<div>{item.name}</div>'
            f'</a></li>\n'
        )

    all_js = json.dumps(
        [asdict(item) for item in all_items],
        ensure_ascii=False
    )

    template = template.replace("{{ITEMS}}", items_html)

    template = template.replace(
        "{{BACK_BUTTON}}",
        back_button_html
    )

    template = template.replace("{{ALL_ITEMS}}", all_js)

    template = template.replace("{{HOME_PAGE}}", index_name)

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(template)

    return html_file



# --------------------
# 主程式
# --------------------
def main():
    root = Tk()
    root.withdraw()

    folder = filedialog.askdirectory(title="選擇漫畫資料夾")
    if not folder:
        return

    comic_name = os.path.basename(folder)
    viewer = os.path.join(OUTPUT_ROOT, comic_name)
    os.makedirs(viewer, exist_ok=True)

    index_name = f"{comic_name}.html"
    generate_index_html(folder, viewer, index_name)

    webbrowser.open(os.path.join(viewer, index_name))


if __name__ == "__main__":
    main()