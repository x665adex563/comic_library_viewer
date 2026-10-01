window.ChapterApp.initPageTurning = function ({
  images,
  pageNavigation,
  updateSinglePagePosition,
  nextChapter,
  previousChapter,
  parentIndex,
}) {
  function showChapterPrompt(message, buttonText, link) {
    const prompt = document.getElementById("chapter-prompt");
    const messageElement = document.getElementById(
      "chapter-prompt-message"
    );
    const button = document.getElementById("chapter-prompt-button");

    messageElement.textContent = message;
    button.textContent = buttonText;

    prompt.style.display = "block";

    button.onclick = () => {
      window.location.href = link;
    };
  }

  function showPage(index) {
    const currentPage = document.querySelector("img.current-page");

    if (!currentPage) {
      return;
    }

    currentPage.classList.remove("current-page");
    images[index].classList.add("current-page");

    updateSinglePagePosition();
    pageNavigation.updateCurrentPageSelect();
    ChapterApp.preloadNearbyPages(images, index);
  }

  function showNextPage() {
    const currentPage = document.querySelector("img.current-page");

    if (!currentPage) {
      return;
    }

    const currentIndex = Array.from(images).indexOf(currentPage);

    if (currentIndex < images.length - 1) {
      showPage(currentIndex + 1);
      return;
    }

    if (nextChapter) {
      showChapterPrompt(
        "要前往下一話嗎？",
        "前往下一話",
        nextChapter
      );
    } else if (parentIndex) {
      showChapterPrompt(
        "已達最新話，是否返回目錄？",
        "返回目錄",
        parentIndex
      );
    }
  }

  function showPreviousPage() {
    const currentPage = document.querySelector("img.current-page");

    if (!currentPage) {
      return;
    }

    const currentIndex = Array.from(images).indexOf(currentPage);

    if (currentIndex > 0) {
      showPage(currentIndex - 1);
      return;
    }

    if (previousChapter) {
      showChapterPrompt(
        "要前往上一話嗎？",
        "前往上一話",
        previousChapter
      );
    }
  }

  return {
    showNextPage,
    showPreviousPage,
  };
};