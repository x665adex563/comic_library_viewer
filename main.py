# 網頁一頁式漫畫瀏覽v3（搜尋欄）
import os
import webbrowser
from tkinter import Tk, filedialog

from viewer import OUTPUT_ROOT, generate_index_html

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