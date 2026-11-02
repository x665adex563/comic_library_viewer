import json
import os

from core.paths import SCRIPT_DIR

TEMPLATE_DIR = os.path.join(SCRIPT_DIR, "templates")
INDEX_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "index.html")
CHAPTER_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "chapter.html")
ITEM_TEMPLATE_PATH = os.path.join(TEMPLATE_DIR, "item.html")
FILE_MANAGEMENT_TEMPLATE_PATH = os.path.join(
    TEMPLATE_DIR, "file-management.html"
)

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
    home_page,
    viewer_path,
    tailwind_css_path,
    file_management_js_path,
):
    template = load_index_template()

    return (
        template
        .replace("{{TITLE}}", title)
        .replace("{{ITEMS}}", items_html)
        .replace("{{BACK_BUTTON}}", back_button_html)
        .replace('"{{ALL_ITEMS}}"', all_items)
        .replace("{{HOME_PAGE}}", home_page)
        .replace("{{VIEWER_PATH}}", json.dumps(viewer_path))
        .replace("{{TAILWIND_CSS}}", tailwind_css_path)
        .replace("{{FILE_MANAGEMENT_JS}}", file_management_js_path)
    )

def render_chapter_template(
    title,
    back_button_html,
    images_html,
    previous_link,
    next_link,
    parent_link,
    viewer_path,
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
        .replace("{{PARENT_INDEX_URL}}", parent_link)
        .replace("{{VIEWER_PATH}}", json.dumps(viewer_path))
        .replace("{{COMIC_TITLE}}", json.dumps(comic_title))
        .replace("{{IS_SERIES}}", json.dumps(is_series))
        .replace("{{TAILWIND_CSS}}", tailwind_css_path)
        .replace("{{CHAPTER_APP_JS}}", chapter_app_js_path)
        .replace("{{PRELOAD_JS}}", preload_js_path)
        .replace("{{REMOTE_MODE_JS}}", remote_mode_js_path)
        .replace("{{SINGLE_PAGE_MODE_JS}}", single_page_mode_js_path)
        .replace("{{SINGLE_PAGE_SETTINGS_JS}}", single_page_settings_js_path)
        .replace("{{READING_HISTORY_JS}}", reading_history_js_path)
        .replace("{{PAGE_NAVIGATION_JS}}", page_navigation_js_path)
        .replace("{{PAGE_TURNING_JS}}", page_turning_js_path)
        .replace("{{UI_VISIBILITY_JS}}", ui_visibility_js_path)
        .replace("{{CHAPTER_EVENTS_JS}}", chapter_events_js_path)
        .replace("{{REMOTE_CONTROLS_JS}}", remote_controls_js_path)
        .replace("{{READING_MODE_JS}}", reading_mode_js_path)
        .replace("{{CHAPTER_JS}}", chapter_js_path)
    )
