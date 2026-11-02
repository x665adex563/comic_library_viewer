import os
import re
from dataclasses import dataclass

IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")

@dataclass
class ViewerItem:
    name: str
    path: str
    images: list[str]
    type: str
    link: str = ""
    thumb: str = ""

def scan_folder(folder):
    """記錄所有資料夾與檔案的狀態。"""
    snapshot = {}

    for current_root, dirs, files in os.walk(folder):
        dirs.sort()
        files.sort()

        relative_root = os.path.relpath(current_root, folder)
        snapshot[relative_root] = {"type": "directory"}

        for filename in files:
            path = os.path.join(current_root, filename)
            relative_path = (
                filename if relative_root == "."
                else os.path.join(relative_root, filename)
            )
            stat = os.stat(path)

            snapshot[relative_path] = {
                "size": stat.st_size,
                "mtime_ns": stat.st_mtime_ns,
            }

    return snapshot

def scan_folder_incremental(folder, previous_snapshot, previous_directories, current_directories):
    """只重新掃描有變動的資料夾，其餘沿用舊紀錄。"""
    previous_snapshot = previous_snapshot or {}
    previous_directories = previous_directories or {}

    changed = {
        path for path, mtime in current_directories.items()
        if previous_directories.get(path) != mtime
    }

    snapshot = {}

    for path, data in previous_snapshot.items():
        directory = path if data.get("type") == "directory" else os.path.dirname(path) or "."

        if directory in current_directories and directory not in changed:
            snapshot[path] = data

    for relative_root in current_directories:
        snapshot[relative_root] = {"type": "directory"}

        if relative_root not in changed:
            continue

        current_root = os.path.join(folder, relative_root)

        with os.scandir(current_root) as entries:
            for entry in entries:
                if not entry.is_file():
                    continue

                stat = entry.stat()
                relative_path = (
                    entry.name if relative_root == "."
                    else os.path.join(relative_root, entry.name)
                )

                snapshot[relative_path] = {
                    "size": stat.st_size,
                    "mtime_ns": stat.st_mtime_ns,
                }

    return snapshot

def compare_snapshots(previous, current):
    """比較兩次掃描結果，找出新增、修改、刪除的路徑。"""
    previous = previous or {}

    added = current.keys() - previous.keys()
    deleted = previous.keys() - current.keys()
    modified = {
        path
        for path in current.keys() & previous.keys()
        if current[path] != previous[path]
    }

    return added, modified, deleted

def scan_directory_times(folder):
    """只記錄所有資料夾的修改時間。"""
    snapshot = {}

    for current_root, dirs, _ in os.walk(folder):
        dirs.sort()

        relative_path = os.path.relpath(current_root, folder)
        snapshot[relative_path] = os.stat(current_root).st_mtime_ns

    return snapshot

def get_changed_chapters(folder, previous, current):
    chapters = set()

    for path in previous.keys() | current.keys():
        old = previous.get(path)
        new = current.get(path)

        if old == new or path == ".":
            continue

        # 資料夾本身發生新增或刪除
        if (old and old.get("type") == "directory") or (
            new and new.get("type") == "directory"
        ):
            chapter_path = path
        else:
            # 檔案變動，取得所屬資料夾
            chapter_path = os.path.dirname(path)

        chapters.add(
            os.path.normpath(os.path.join(folder, chapter_path))
        )

    return chapters

def get_changed_directories(previous, current):
    """取得新增或刪除的資料夾。"""
    changed = set()

    for path in previous.keys() | current.keys():
        old = previous.get(path)
        new = current.get(path)

        old_is_dir = old is not None and old.get("type") == "directory"
        new_is_dir = new is not None and new.get("type") == "directory"

        if old_is_dir != new_is_dir:
            changed.add(path)

    return changed

def natural_sort_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r'([0-9]+)', s)]

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
