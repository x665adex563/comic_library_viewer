
window.ChapterApp.initPageNavigation = ({
  pageSelect,
  images,
  getReadingMode,
  onPageChange,
  updateSinglePagePosition,
  updateReadingHistoryPage,
}) => {
  const updatePageSelect = () => {
    pageSelect.innerHTML = "";

    images.forEach((image, index) => {
      const option = document.createElement("option");

      option.value = index;
      option.textContent = `${index + 1}/${images.length}`;

      pageSelect.appendChild(option);
    });
  };

  const updateCurrentPageSelect = () => {
    const currentPage = document.querySelector("img.current-page");

    if (!currentPage) {
      return;
    }

    const currentIndex = Array.from(images).indexOf(currentPage);

    pageSelect.value = currentIndex;

    onPageChange(currentIndex);

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
  });

  return {
    updatePageSelect,
    updateCurrentPageSelect,
  };
};
