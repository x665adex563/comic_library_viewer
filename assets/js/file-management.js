
let libraryHandle = null;


async function getLibraryHandle() {
  const expectedName = viewerPath.replace(/[\\/]+$/, "").split(/[\\/]/).pop();

  if (libraryHandle) {
    const permission = await libraryHandle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") return libraryHandle;
  }

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("comic-viewer", 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore("settings");
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const savedHandle = await new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const request = tx.objectStore("settings").get(viewerPath);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (savedHandle?.name === expectedName) {
    const permission = await savedHandle.queryPermission({ mode: "readwrite" });

    if (permission === "granted") {
      libraryHandle = savedHandle;
      db.close();
      return savedHandle;
    }
  }

  const handle = await window.showDirectoryPicker({
    id: "comic-library",
    mode: "readwrite",
    ...(savedHandle ? { startIn: savedHandle } : {})
  });

  if (handle.name !== expectedName) {
    db.close();
    throw new Error(`請選擇漫畫庫資料夾：${expectedName}`);
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put(handle, viewerPath);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  libraryHandle = handle;
  return handle;
}

async function deleteComic(card) {
  const path = JSON.parse(card.dataset.itemPath);
  const parts = path.split("/");

  if (
    parts.length === 0 ||
    parts.some(part => !part || part === "." || part === "..")
  ) {
    throw new Error("無效的漫畫資料夾路徑");
  }

  const name = parts[parts.length - 1];

  if (!confirm(`確定永久刪除「${name}」嗎？\n\n此操作無法復原。`)) {
    return;
  }

  const root = await getLibraryHandle();

  let parent = root;

  for (const part of parts.slice(0, -1)) {
    parent = await parent.getDirectoryHandle(part);
  }

  // 刪除前確認目標確實是資料夾
  await parent.getDirectoryHandle(name);

  await parent.removeEntry(name, { recursive: true });

  card.remove();
  cardTemplates.delete(path);

  // 同步移除搜尋資料，避免搜尋到已刪除的漫畫
  const index = all.findIndex(item =>
    item.path === path
  );

  if (index !== -1) {
    all.splice(index, 1);
  }

  alert(`已刪除：${name}`);
}

document.getElementById("list").addEventListener("click", async event => {
  const button = event.target.closest('[data-action="delete"]');

  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const card = button.closest("[data-item-path]");
  if (!card) return;

  button.disabled = true;

  try {
    await deleteComic(card);
  } catch (error) {
    if (error.name !== "AbortError") {
      alert(`刪除失敗：${error.message}`);
    }
  } finally {
    button.disabled = false;
  }
});
