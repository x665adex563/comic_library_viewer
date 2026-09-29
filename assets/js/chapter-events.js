window.ChapterApp.initChapterEvents = function ({
  getReadingMode,
  getWheelPageEnabled,
  setWheelPageEnabled,
  updateReadingMode,
  showUI,
  hideUI,
  showNextPage,
  showPreviousPage,
  parentIndex,
  settingsPanel,
  remoteModeUI,
  readingHistoryPanel,
  wheelPageButton,
  images,
}) {
  document.addEventListener("keydown", (event) => {
    if (getReadingMode() !== "single") {
      return;
    }

    if (event.key === "ArrowRight") {
      showNextPage();
    }

    if (event.key === "ArrowLeft") {
      showPreviousPage();
    }

    if (event.key === "ArrowUp") {
      window.location.href = parentIndex;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const prompt = document.getElementById("chapter-prompt");

      if (prompt.style.display === "block") {
        const button = document.getElementById("chapter-prompt-button");
        button.click();
      }
    }

    if (event.key === "Escape") {
      const prompt = document.getElementById("chapter-prompt");

      if (prompt.style.display === "block") {
        prompt.style.display = "none";
      }
    }
  });
};
