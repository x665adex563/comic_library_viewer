# 網頁一頁式漫畫瀏覽 v3（增量檢查）
import json
import os
import webbrowser
import time
from tkinter import Tk, filedialog

from viewer import OUTPUT_ROOT, generate_index_html


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

def main():
    root = Tk()
    root.withdraw()

    folder = filedialog.askdirectory(title="選擇漫畫資料夾")
    root.destroy()

    if not folder:
        return

    start = time.perf_counter()

    comic_name = os.path.basename(folder)
    viewer = os.path.join(OUTPUT_ROOT, comic_name)
    os.makedirs(viewer, exist_ok=True)

    index_name = f"{comic_name}.html"
    index_path = os.path.join(viewer, index_name)
    snapshot_path = os.path.join(viewer, ".snapshot.json")

    start = time.perf_counter()


    directory_snapshot_path = os.path.join(
        viewer, ".directory_snapshot.json"
    )

    current_directories = scan_directory_times(folder)

    previous_directories = None
    if os.path.isfile(directory_snapshot_path):
        with open(directory_snapshot_path, "r", encoding="utf-8") as f:
            previous_directories = json.load(f)

    if (
        current_directories == previous_directories
        and os.path.isfile(index_path)
    ):
        print("快速檢查完成，沒有偵測到變動")
    else:
        print("偵測到可能變動，執行完整掃描...")

        current_snapshot = scan_folder(folder)

        previous_snapshot = None
        if os.path.isfile(snapshot_path):
            with open(snapshot_path, "r", encoding="utf-8") as f:
                previous_snapshot = json.load(f)

        added, modified, deleted = compare_snapshots(
            previous_snapshot,
            current_snapshot
        )

        if added or modified or deleted or not os.path.isfile(index_path):
            print(f"新增：{len(added)} 個")
            print(f"修改：{len(modified)} 個")
            print(f"刪除：{len(deleted)} 個")

            print("重新產生 HTML...")

            changed_chapters = get_changed_chapters(
                folder, previous_snapshot or {}, current_snapshot
            )

            changed_directories = {
                os.path.normpath(os.path.join(folder, path))
                for path in get_changed_directories(
                    previous_snapshot or {}, current_snapshot
                )
            }

            generate_index_html(
                folder,
                viewer,
                index_name,
                library_root=folder,
                changed_chapters=changed_chapters,
                changed_directories=changed_directories,
            )

            print("HTML 產生完成")

        with open(snapshot_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(current_snapshot, ensure_ascii=False))

        with open(directory_snapshot_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(current_directories, ensure_ascii=False))

    webbrowser.open(index_path)

    print(f"總執行時間：{time.perf_counter() - start:.2f} 秒")

if __name__ == "__main__":
    main()
