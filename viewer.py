import json
import os
import html
from core.paths import SCRIPT_DIR, html_safe_path
from core.templates import (
    FILE_MANAGEMENT_TEMPLATE_PATH,
    load_item_template,
    render_index_template,
    render_chapter_template,
)
from core.scanner import (
    IMAGE_EXTS,
    natural_sort_key,
    scan_directory,
)
from natsort import os_sorted

def render_item_html(item, library_root):
    template = load_item_template()

    with open(FILE_MANAGEMENT_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        file_management_html = f.read()

    thumb_html = (
        f'<img class="w-full aspect-[3/4] object-cover" src="{item.thumb}">'
        if item.type == "image"
        else '<div class="folder-thumb">📁</div>'
    )

    return (
        template
        .replace("{{LINK}}", item.link)
        .replace("{{THUMB}}", thumb_html)
        .replace("{{NAME}}", item.name)
        .replace(
            "{{ITEM_PATH}}",
            html.escape(
                json.dumps(
                    os.path.relpath(item.path, library_root).replace("\\", "/"),
                    ensure_ascii=False
                ),
                quote=True
            )
        )
        .replace("{{FILE_MANAGEMENT}}", file_management_html)
    )

# --------------------
# 單話漫畫頁
# --------------------
def generate_chapter_html(
    folder,
    viewer_folder,
    parent_index_html,
    previous_item,
    next_item,
    library_root,
    is_series,
):
    images = os_sorted(
        [f for f in os.listdir(folder) if f.lower().endswith(IMAGE_EXTS)]
    )

    folder_name = os.path.basename(folder)
    relative_parent = os.path.relpath(os.path.dirname(folder), library_root)
    output_dir = os.path.join(viewer_folder, relative_parent)
    os.makedirs(output_dir, exist_ok=True)

    html_file = os.path.join(output_dir, f"{folder_name}.html")

    comic_title = (
        os.path.splitext(os.path.basename(parent_index_html))[0]
        if is_series
        else folder_name
    )

    previous_link = ""
    next_link = ""

    if previous_item:
        previous_link = html_safe_path(
            os.path.join(output_dir, f"{previous_item.name}.html"),
            html_file
        )

    if next_item:
        next_link = html_safe_path(
            os.path.join(output_dir, f"{next_item.name}.html"),
            html_file
        )

    back_button_html = ""
    parent_link = ""

    if parent_index_html:
        parent_link = html_safe_path(
            parent_index_html,
            html_file
        )

        back_button_html = (
            '<div id="back" class="ui-fade fixed top-5 left-5 z-[1000]">'
            f'<a class="absolute top-[10px] left-[10px] p-[50px] bg-black text-white '
            f'no-underline rounded-lg text-[20px] opacity-40 '
            f'hover:opacity-100 hover:bg-[#222222] transition-[opacity,background] '
            f'duration-[250ms] ease-in-out" '
            f'href="{parent_link}">←</a>'
            '</div>'
        )

    images_html = ""

    for img in images:
        images_html += (
            f'<img class="block max-w-[var(--single-page-max-width)] h-auto mx-auto" '
            f'loading="lazy" '
            f'src="{html_safe_path(os.path.join(folder, img), html_file)}">\n'
        )

    tailwind_css_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "tailwind-output.css"),
        html_file,
    )

    chapter_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "chapter.js"),
        html_file,
    )

    preload_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "preload.js"),
        html_file,
    )

    chapter_app_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "chapter-app.js"),
        html_file,
    )

    remote_mode_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "remote-mode.js"),
        html_file,
    )

    single_page_mode_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "single-page-mode.js"),
        html_file,
    )

    single_page_settings_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "single-page-settings.js"),
        html_file,
    )

    reading_history_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "reading-history.js"),
        html_file,
    )

    page_navigation_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "page-navigation.js"),
        html_file,
    )

    page_turning_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "page-turning.js"),
        html_file,
    )

    ui_visibility_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "ui-visibility.js"),
        html_file,
    )

    chapter_events_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "chapter-events.js"),
        html_file,
    )

    remote_controls_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "remote-controls.js"),
        html_file,
    )

    reading_mode_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "reading-mode.js"),
        html_file,
    )

    template = render_chapter_template(
        folder_name,
        back_button_html,
        images_html,
        previous_link,
        next_link,
        parent_link,
        library_root,
        comic_title,
        is_series,
        tailwind_css_path,
        chapter_js_path,
        chapter_app_js_path,
        preload_js_path,
        remote_mode_js_path,
        single_page_mode_js_path,
        single_page_settings_js_path,
        reading_history_js_path,
        page_navigation_js_path,
        page_turning_js_path,
        ui_visibility_js_path,
        chapter_events_js_path,
        remote_controls_js_path,
        reading_mode_js_path,
    )

    if os.path.isfile(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            if f.read() == template:
                return html_file

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(template)

    return html_file


# --------------------
# 目錄頁
# --------------------
def generate_index_html(
    folder,
    viewer_folder,
    index_name,
    parent_index_html=None,
    all_items=None,
    library_root=None,
    changed_chapters=None,
    changed_directories=None,
):
    if all_items is None:
        all_items = []

    relative_folder = os.path.relpath(folder, library_root)
    output_dir = os.path.join(viewer_folder, relative_folder)
    os.makedirs(output_dir, exist_ok=True)

    html_file = os.path.join(
        output_dir,
        index_name if relative_folder == "." else "index.html"
    )
    folder_name = os.path.basename(folder)

    if parent_index_html:
        back_button_html = (
            '<div id="back" class="fixed top-5 left-5 z-[1000]">'
            f'<a class="absolute top-[10px] left-[10px] p-[50px] bg-black text-white '
            f'no-underline rounded-lg text-[20px] opacity-40 '
            f'hover:opacity-100 hover:bg-[#222222] transition-[opacity,background] '
            f'duration-[250ms] ease-in-out" '
            f'href="{html_safe_path(parent_index_html, html_file)}">←</a>'
            '</div>'
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

    chapter_structure_changed = (
        changed_directories is not None
        and any(
            os.path.dirname(path) == os.path.normpath(folder)
            for path in changed_directories
        )
    )

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
            is_series = len(chapter_items) > 1

            chapter_html = os.path.join(
                output_dir, f"{item.name}.html"
            )

            if (
                changed_chapters is None
                or os.path.normpath(item.path) in changed_chapters
                or chapter_structure_changed
                or not os.path.isfile(chapter_html)
            ):
                generate_chapter_html(
                    d_path,
                    viewer_folder,
                    html_file,
                    previous_item,
                    next_item,
                    library_root,
                    is_series,
                )

            link = html_safe_path(chapter_html, html_file)
            thumb = html_safe_path(
                os.path.join(d_path, item.images[0]),
                html_file
            )

            item.link = link
            item.thumb = thumb

        else:
            sub_index = "index.html"

            generate_index_html(
                d_path,
                viewer_folder,
                sub_index,
                html_file,
                all_items,
                library_root,
                changed_chapters,
                changed_directories,
            )

            item.link = html_safe_path(
                os.path.join(output_dir, item.name, sub_index),
                html_file
            )
            item.thumb = ""

        all_items.append(item)

        items_html += render_item_html(item, library_root)

    all_js = json.dumps(
        [
            {
                "name": item.name,
                "type": item.type,
                "link": item.link,
                "thumb": item.thumb,
                "path": os.path.relpath(
                    item.path, library_root
                ).replace("\\", "/"),
            }
            for item in all_items
        ],
        ensure_ascii=False
    )

    tailwind_css_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "tailwind-output.css"),
        html_file,
    )

    file_management_js_path = html_safe_path(
        os.path.join(SCRIPT_DIR, "assets", "js", "file-management.js"),
        html_file,
    )

    template = render_index_template(
        folder_name,
        items_html,
        back_button_html,
        all_js,
        index_name,
        library_root,
        tailwind_css_path,
        file_management_js_path,
    )

    if os.path.isfile(html_file):
        with open(html_file, "r", encoding="utf-8") as f:
            if f.read() == template:
                return html_file

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(template)

    return html_file
