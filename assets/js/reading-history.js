window.ChapterApp.initReadingHistoryPanel = ({
  readingHistoryButton,
  readingHistoryPanel,
  storageKey,
}) => {
  readingHistoryButton.addEventListener("click", () => {
    const isVisible = readingHistoryPanel.style.display === "block";

    if (isVisible) {
      readingHistoryPanel.style.display = "none";
      return;
    }

    const history = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    readingHistoryPanel.innerHTML = history.length
      ? history.map((item, index) => `
          <div class="reading-history-item flex justify-between items-center p-2.5 border border-[#555] rounded-md mb-2" data-index="${index}">
            <div>
              <span class="reading-history-title cursor-pointer hover:underline hover:opacity-70">${item.comicTitle}</span>
              ${item.isSeries
                ? `<span class="reading-history-chapter inline-block ml-2 py-[3px] px-2 bg-[#444] rounded-[5px] cursor-pointer hover:underline hover:opacity-70">第 ${item.title} 話</span>`
                : ""}
            </div>
            <button class="reading-history-delete hover:opacity-70">×</button>
          </div>
        `).join("")
      : "目前沒有閱讀紀錄";

    document.querySelectorAll(".reading-history-item").forEach((item) => {
      const index = Number(item.dataset.index);
      const record = history[index];

      const title = item.querySelector(".reading-history-title");
      const chapter = item.querySelector(".reading-history-chapter");
      const deleteButton = item.querySelector(".reading-history-delete");

      deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();

        history.splice(index, 1);

        localStorage.setItem(
          storageKey,
          JSON.stringify(history)
        );

        item.remove();
      });

      title.addEventListener("click", () => {
        if (record.isSeries) {
          location.href = record.parentIndex;
        } else {
          location.href = record.url;
        }
      });

      if (chapter) {
        chapter.addEventListener("click", () => {
          location.href = `${record.url}?page=${record.page}`;
        });
      }
    });

    readingHistoryPanel.style.display = "block";
  });
};

window.ChapterApp.updateReadingHistoryPage = ({
  storageKey,
  comicTitle,
  page,
}) => {
  const history = JSON.parse(
    localStorage.getItem(storageKey) || "[]"
  );

  const record = history.find(
    (item) => item.comicTitle === comicTitle
  );

  if (record) {
    record.page = page;

    localStorage.setItem(
      storageKey,
      JSON.stringify(history)
    );
  }
};

window.ChapterApp.saveReadingHistory = ({
  storageKey,
  comicTitle,
  parentIndex,
  isSeries,
  page,
}) => {
  const history = JSON.parse(
    localStorage.getItem(storageKey) || "[]"
  );

  const existingIndex = history.findIndex(
    (item) => item.comicTitle === comicTitle
  );

  const record = {
    title: document.title,
    comicTitle,
    parentIndex,
    isSeries,
    url: location.href.split("?")[0],
    page,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    history.splice(existingIndex, 1);
  }

  history.unshift(record);

  localStorage.setItem(
    storageKey,
    JSON.stringify(history.slice(0, 10))
  );
};
