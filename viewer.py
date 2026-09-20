import json
import os
import re
import sys
from dataclasses import asdict, dataclass
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
CHAPTER_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "chapter.html")
ITEM_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "item.html")

def load_index_template():
    with open(INDEX_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

def load_chapter_template():
    with open(CHAPTER_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

def load_item_template():
    with open(ITEM_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        return f.read()

def render_index_template(
    title,
    items_html,
    back_button_html,
    all_items,
    home_page
):
    template = load_index_template()

    return (
        template
        .replace("{{TITLE}}", title)
        .replace("{{ITEMS}}", items_html)
        .replace("{{BACK_BUTTON}}", back_button_html)
        .replace('"{{ALL_ITEMS}}"', all_items)
        .replace("{{HOME_PAGE}}", home_page)
    )

def render_chapter_template(
    title,
    back_button_html,
    images_html,
    previous_link,
    next_link,
):
    template = load_chapter_template()

    previous_chapter_html = ""

    if previous_link:
        previous_chapter_html = (
            f'<a href="{previous_link}">上一話</a>'
        )

    next_chapter_html = ""

    if next_link:
        next_chapter_html = (
            f'<a href="{next_link}">下一話</a>'
        )

    return (
        template
        .replace("{{TITLE}}", title)
        .replace("{{BACK_BUTTON}}", back_button_html)
        .replace("{{IMAGES}}", images_html)
        .replace("{{PREVIOUS_CHAPTER}}", previous_chapter_html)
        .replace("{{PREVIOUS_CHAPTER_URL}}", previous_link)
        .replace("{{NEXT_CHAPTER}}", next_chapter_html)
        .replace("{{NEXT_CHAPTER_URL}}", next_link)
    )

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
    subdirs = [
        d
        for d in os.listdir(folder)
        if os.path.isdir(os.path.join(folder, d))
    ]

    folder_items = []
    image_items = []

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
            image_items.append(item)
        else:
            item = ViewerItem(
                name=d,
                path=d_path,
                images=[],
                type="folder"
            )
            folder_items.append(item)

    folder_items.sort(key=lambda item: natural_sort_key(item.name))
    image_items.sort(key=lambda item: natural_sort_key(item.name))

    return folder_items + image_items

def render_item_html(item):
    template = load_item_template()

    thumb_html = (
        f'<img class="thumb-img" src="{item.thumb}">'
        if item.type == "image"
        else '<div class="folder-thumb">📁</div>'
    )

    return (
        template
        .replace("{{LINK}}", item.link)
        .replace("{{THUMB}}", thumb_html)
        .replace("{{NAME}}", item.name)
    )

# --------------------
# 單話漫畫頁
# --------------------
def generate_chapter_html(
    folder,
    viewer_folder,
    parent_index_html,
    previous_item,
    next_item
):
    images = sorted(
        [f for f in os.listdir(folder) if f.lower().endswith(IMAGE_EXTS)],
        key=natural_sort_key
    )

    folder_name = os.path.basename(folder)
    html_file = os.path.join(viewer_folder, f"{folder_name}.html")

    previous_link = ""
    next_link = ""

    if previous_item:
        previous_link = quote(
            os.path.basename(
                os.path.join(viewer_folder, f"{previous_item.name}.html")
            )
        )

    if next_item:
        next_link = quote(
            os.path.basename(
                os.path.join(viewer_folder, f"{next_item.name}.html")
            )
        )

    back_button_html = ""

    if parent_index_html:
        parent_link = html_safe_path(
            parent_index_html,
            html_file
        )

        back_button_html = (
            '<div id="back">'
            f'<a href="{parent_link}">←</a>'
            '</div>'
        )

    images_html = ""

    for img in images:
        images_html += (
            f'<img loading="lazy" src="{html_safe_path(os.path.join(folder, img), html_file)}">\n'
        )

    template = render_chapter_template(
        folder_name,
        back_button_html,
        images_html,
        previous_link,
        next_link,
    )

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(template)

    return html_file


# --------------------
# 目錄頁
# --------------------
def generate_index_html(folder, viewer_folder, index_name, parent_index_html=None, all_items=None):
    if all_items is None:
        all_items = []

    html_file = os.path.join(viewer_folder, index_name)
    folder_name = os.path.basename(folder)

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

    chapter_items = [
        item
        for item in items
        if item.type == "image" and item.name.isdigit()
    ]

    for item in items:
        d_path = item.path

        previous_item = None
        next_item = None

        if item in chapter_items:
            chapter_index = chapter_items.index(item)

            if chapter_index > 0:
                previous_item = chapter_items[chapter_index - 1]

            if chapter_index < len(chapter_items) - 1:
                next_item = chapter_items[chapter_index + 1]

        if item.type == "image":
            chapter_html = generate_chapter_html(
                d_path,
                viewer_folder,
                html_file,
                previous_item,
                next_item,
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

        items_html += render_item_html(item)

    all_js = json.dumps(
        [asdict(item) for item in all_items],
        ensure_ascii=False
    )

    template = render_index_template(
        folder_name,
        items_html,
        back_button_html,
        all_js,
        index_name
    )

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(template)

    return html_file
