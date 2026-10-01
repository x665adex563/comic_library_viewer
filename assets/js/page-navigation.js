
window.ChapterApp.initPageNavigation = ({
  pageSelect,
  images,
  getReadingMode,
  updateSinglePagePosition,
  updateReadingHistoryPage,
}) => {
  let currentPage = 0;

  const updatePageSelect = () => {
    pageSelect.innerHTML = "";

    images.forEach((image, index) => {
      const option = document.createElement("option");

      option.value = index;
      option.textContent = `${index + 1}/${images.length}`;

      pageSelect.appendChild(option);
    });
  };

  const updateCurrentPageSelect = (pageIndex = null) => {
    let currentIndex = pageIndex;

    if (currentIndex === null) {
      const currentImage = document.querySelector("img.current-page");

      if (!currentImage) {
        return;
      }

      currentIndex = Array.from(images).indexOf(currentImage);
    }

    if (currentIndex < 0 || currentIndex >= images.length) {
      return;
    }

    pageSelect.value = currentIndex;
    currentPage = currentIndex;

    window.history.replaceState(
      null,
      "",
      `?page=${currentIndex}`
    );

    updateReadingHistoryPage(currentIndex);
  };

  pageSelect.addEventListener("change", () => {
    const pageIndex = Number(pageSelect.value);

    if (getReadingMode() === "single") {
      images.forEach((image) => {
        image.classList.remove("current-page");
      });

      images[pageIndex].classList.add("current-page");
      updateSinglePagePosition();
    } else {
      images[pageIndex].scrollIntoView();
    }

    updateCurrentPageSelect();
  });

  const initializePageFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const page = Number(params.get("page"));

    if (Number.isNaN(page) || page < 0 || page >= images.length) {
      return;
    }

    images.forEach((image) => {
      image.classList.remove("current-page");
    });

    images[page].classList.add("current-page");
    currentPage = page;
    pageSelect.value = page;
  };

  return {
    updatePageSelect,
    updateCurrentPageSelect,
    initializePageFromUrl,
    getCurrentPage: () => currentPage,
  };
};
