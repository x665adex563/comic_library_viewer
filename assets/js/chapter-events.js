window.ChapterApp.initChapterEvents = function ({
  getReadingMode,
  showNextPage,
  showPreviousPage,
  parentIndex,
  updateSinglePagePosition,
  updateRemoteImagePosition,
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

  images.forEach((image) => {
    image.addEventListener("load", () => {
      if (image.classList.contains("current-page")) {
        updateSinglePagePosition();
        updateRemoteImagePosition();
      }
    });

    image.addEventListener("click", () => {
      if (document.body.dataset.displayMode === "remote") return;
      if (getReadingMode() === "single") showNextPage();
    });

    image.addEventListener("contextmenu", (event) => {
      if (document.body.dataset.displayMode === "remote") {
        event.preventDefault();
        return;
      }

      if (getReadingMode() === "single") {
        event.preventDefault();
        showPreviousPage();
      }
    });
  });
};
