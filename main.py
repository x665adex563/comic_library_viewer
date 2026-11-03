# 網頁一頁式漫畫瀏覽 v3（增量檢查）
import json
import os
import webbrowser
import time
import sys
from tkinter import Tk, filedialog

from viewer import generate_index_html
from core.paths import OUTPUT_ROOT
from core.scanner import (
    scan_folder,
    scan_folder_incremental,
    compare_snapshots,
    scan_directory_times,
    get_changed_chapters,
    get_changed_directories,
)

def main():
    force = "--force" in sys.argv
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

    t = time.perf_counter()
    current_directories = scan_directory_times(folder)
    print(f"[效能] 資料夾檢查：{time.perf_counter() - t:.2f} 秒")

    previous_directories = None
    if os.path.isfile(directory_snapshot_path):
        with open(directory_snapshot_path, "r", encoding="utf-8") as f:
            previous_directories = json.load(f)

    if (
        not force
        and current_directories == previous_directories
        and os.path.isfile(index_path)
    ):
        print("快速檢查完成，沒有偵測到變動")
    else:
        print("偵測到可能變動，開始掃描...")

        previous_snapshot = None
        if os.path.isfile(snapshot_path):
            with open(snapshot_path, "r", encoding="utf-8") as f:
                previous_snapshot = json.load(f)

        t = time.perf_counter()

        if previous_snapshot is None or previous_directories is None:
            current_snapshot = scan_folder(folder)
        else:
            current_snapshot = scan_folder_incremental(
                folder,
                previous_snapshot,
                previous_directories,
                current_directories,
            )

        print(f"[效能] 檔案掃描：{time.perf_counter() - t:.2f} 秒")

        added, modified, deleted = compare_snapshots(
            previous_snapshot,
            current_snapshot
        )

        if force or added or modified or deleted or not os.path.isfile(index_path):
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

            t = time.perf_counter()

            generate_index_html(
                folder,
                viewer,
                index_name,
                library_root=folder,
                changed_chapters=changed_chapters,
                changed_directories=changed_directories,
            )

            print(f"[效能] HTML 產生：{time.perf_counter() - t:.2f} 秒")

            print("HTML 產生完成")

        t = time.perf_counter()

        with open(snapshot_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(current_snapshot, ensure_ascii=False))

        with open(directory_snapshot_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(current_directories, ensure_ascii=False))

        print(f"[效能] Snapshot 儲存：{time.perf_counter() - t:.2f} 秒")

    webbrowser.open(index_path)

    print(f"總執行時間：{time.perf_counter() - start:.2f} 秒")

if __name__ == "__main__":
    main()
