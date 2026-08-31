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

    items = scan_directory(folder)

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
        
    all_js = json.dumps(
        [asdict(item) for item in all_items],
        ensure_ascii=False
    )

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>{folder_name}</title>
<style>
body {{
  background: #000;
  color: #fff;
  font-family: sans-serif;
}}
a,a:visited,a:hover,a:active {{
  color: #fff;
  text-decoration: none;
}}
.item-name {{
  margin-top: 6px;
  font-size: 14px;
  text-align: center;
  word-break: break-word;
}}
#search {{
  display:block;
  margin: 100px auto 12px auto;
  width:280px;
  padding:8px 12px;
  background:#fff;
  color:#000;
  border-radius:6px;
  border:1px solid #444;
}}
#suggestions {{
  margin:0 auto;
  width:280px;
  max-height:150px;
  overflow-y:auto;
  background:#222;
  color:#fff;
  border-radius:6px;
  display:none;
  position:absolute;
  left:50%;
  transform:translateX(-50%);
  z-index:500;
  font-size:14px;
}}
#suggestions div {{
  padding:6px 10px;
  cursor:pointer;
}}
#suggestions div:hover {{
  background:#444;
}}
ul {{
  list-style:none;
  padding:0;
  display:flex;
  flex-wrap:wrap;
  gap:20px;
  max-width:1200px;
  margin:20px auto;
}}
li {{
  width:200px;
  background:#111;
  padding:10px;
  text-align:center;
  border-radius: 8px;
}}
.thumb-img {{
  width:100%;
  aspect-ratio:3/4;
  object-fit:cover;
}}
.folder-thumb {{
  width:100%;
  height:32px;
  aspect-ratio:3/4;
  background:#111;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:24px;
}}
#back {{
  position: fixed;
  top: 20px;
  left: 0;
  width: 100%;
  z-index: 1000;
  text-align: center;
}}
#back a {{
  display: inline-block;
  width: 100%;
  padding: 20px 0;
  background: #000;
  color: #fff;
  border-radius: 8px;
  font-size: 20px;
  opacity: 0.6;
}}
#home {{
  display:none;
  position:fixed;
  top:20px;
  left:20px;
  z-index:200;
}}
#home a {{
  display:block;
  padding:50px 50px;
  background:#000;
  color:#fff;
  border-radius:8px;
  font-size:20px;
  opacity:0.4;
  text-decoration:none;
}}
#toTop {{
  position:fixed;
  bottom:20px;
  right:20px;
  width:80px;
  height:80px;
  background:#111;
  color:#524d5e;
  border:none;
  border-radius:12px;
  font-size:28px;
}}
#toTop:hover {{
  background: rgba(255, 255, 255, 0.3);
  color: rgba(0,0,0,0.35);
  cursor:pointer;
}}
</style>
</head>
<body>
""")

        # 返回上一頁
        if parent_index_html:
            f.write(f'<div id="back"><a href="{html_safe_path(parent_index_html, html_file)}">←</a></div>\n')

        # 回首頁按鈕
        f.write(f'<div id="home"><a href="#" onclick="goHome()">🏠</a></div>\n')

        # 搜尋欄 + 提示欄
        f.write('<input id="search" placeholder="搜尋資料夾">\n')
        f.write('<div id="suggestions"></div>\n')

        # 列出目錄
        f.write('<ul id="list">\n')
        for item in items:
            thumb = (
                f'<img class="thumb-img" src="{item.thumb}">'
                if item.type == "image"
                else '<div class="folder-thumb">📁</div>'
            )

            f.write(
                f'<li><a href="{item.link}">{thumb}<div>{item.name}</div></a></li>\n'
            )
        f.write('</ul>\n')

        # JavaScript 搜尋 + 回首頁
        f.write(f"""
<button id="toTop" onclick="window.scrollTo({{top:0,behavior:'smooth'}})">↑</button>
<script>
const all = {all_js};
const HOME_PAGE = "{index_name}";

const searchInput = document.getElementById('search');
const suggestionBox = document.getElementById('suggestions');

function updateSuggestions() {{
    const val = searchInput.value.toLowerCase();
    if(!val) {{
        suggestionBox.style.display = 'none';
        return;
    }}
    const matches = all.filter(i => i.name.toLowerCase().includes(val));
    suggestionBox.innerHTML = '';
    matches.forEach(m => {{
        const div = document.createElement('div');
        div.textContent = m.name;
        div.onclick = () => {{
            searchInput.value = m.name;
            search();
            suggestionBox.style.display = 'none';
        }};
        suggestionBox.appendChild(div);
    }});
    suggestionBox.style.display = matches.length ? 'block':'none';
}}

function search(){{
  const v = searchInput.value.toLowerCase();
  sessionStorage.setItem('last_search', v);
  const ul = document.getElementById('list');
  ul.innerHTML = '';
  document.getElementById('home').style.display = 'block';

  const r = all.filter(i => i.name.toLowerCase().includes(v));
  if(!r.length){{
    ul.innerHTML = '<li>找不到資料</li>';
    return;
  }}

  r.forEach(i => {{
    let thumb = '';
    if(i.type==='image') {{
      thumb = '<img class="thumb-img" src="' + i.thumb + '">';
    }} else {{
      thumb = '<div class="folder-thumb">📁</div>';
    }}
    ul.innerHTML += '<li><a href="' + i.link + '">' + thumb + '<div>' + i.name + '</div></a></li>';
  }});
}}

searchInput.addEventListener('input', updateSuggestions);
searchInput.addEventListener('keydown', e => {{
    if(e.key==='Enter') {{
        search();
        suggestionBox.style.display = 'none';
    }}
}});

function goHome(){{
  sessionStorage.removeItem('last_search');
  location.href = HOME_PAGE;
}}

window.addEventListener('DOMContentLoaded', () => {{
  const last = sessionStorage.getItem('last_search');
  if(last){{
    searchInput.value = last;
    search();
  }}
}});
</script>
</body>
</html>
""")

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