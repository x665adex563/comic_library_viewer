
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


async function copyFolder(source, destination) {
  for await (const [name, entry] of source.entries()) {
    if (entry.kind === "directory") {
      const child = await destination.getDirectoryHandle(name, {
        create: true
      });

      await copyFolder(entry, child);
    } else {
      const file = await entry.getFile();
      const target = await destination.getFileHandle(name, {
        create: true
      });

      const writable = await target.createWritable();

      try {
        await file.stream().pipeTo(writable);
      } catch (error) {
        await writable.abort().catch(() => {});
        throw error;
      }
    }
  }
}

async function compareFolders(source, destination) {
  const sourceEntries = new Map();

  for await (const [name, entry] of source.entries()) {
    sourceEntries.set(name, entry);
  }

  const destinationEntries = new Map();

  for await (const [name, entry] of destination.entries()) {
    destinationEntries.set(name, entry);
  }

  if (sourceEntries.size !== destinationEntries.size) {
    return false;
  }

  for (const [name, entry] of sourceEntries) {
    const target = destinationEntries.get(name);

    if (!target || entry.kind !== target.kind) {
      return false;
    }

    if (entry.kind === "directory") {
      if (!(await compareFolders(entry, target))) {
        return false;
      }
    } else {
      const sourceFile = await entry.getFile();
      const targetFile = await target.getFile();

      if (sourceFile.size !== targetFile.size) {
        return false;
      }

      const sourceHash = await crypto.subtle.digest(
        "SHA-256",
        await sourceFile.arrayBuffer()
      );

      const targetHash = await crypto.subtle.digest(
        "SHA-256",
        await targetFile.arrayBuffer()
      );

      const a = new Uint8Array(sourceHash);
      const b = new Uint8Array(targetHash);

      if (!a.every((value, index) => value === b[index])) {
        return false;
      }
    }
  }

  return true;
}

async function moveComic(card) {
  const path = JSON.parse(card.dataset.itemPath);
  const parts = path.split("/");

  if (parts.some(part => !part || part === "." || part === "..")) {
    throw new Error("無效的漫畫資料夾路徑");
  }

  const root = await getLibraryHandle();

  const destination = await window.showDirectoryPicker({
    id: "comic-move-destination",
    mode: "readwrite",
    startIn: root
  });

  const destinationPath = await root.resolve(destination);

  if (destinationPath === null) {
    alert("目的地不在目前漫畫庫內，已取消移動。");
    return;
  }

  const sourcePath = parts.slice(0, -1);

  const isInsideSource =
    destinationPath.length >= parts.length &&
    parts.every((part, index) => destinationPath[index] === part);

  if (isInsideSource) {
    alert("不能將漫畫移動到自己的資料夾或子資料夾。");
    return;
  }

  if (
    destinationPath.length === sourcePath.length &&
    destinationPath.every((part, index) => part === sourcePath[index])
  ) {
    alert("來源與目的地相同，不需要移動。");
    return;
  }

  const name = parts.at(-1);

  let sourceParent = root;

  for (const part of sourcePath) {
    sourceParent = await sourceParent.getDirectoryHandle(part);
  }

  const source = await sourceParent.getDirectoryHandle(name);

  // 不覆蓋既有資料夾或檔案
  for await (const [entryName] of destination.entries()) {
    if (entryName === name) {
      throw new Error(`目的地已存在「${name}」，已取消移動`);
    }
  }

  const targetPath = [...destinationPath, name].join("/");

  if (!confirm(
    `確定移動「${name}」嗎？\n\n` +
    `來源：${path}\n` +
    `目的地：${targetPath}`
  )) {
    return;
  }

  const target = await destination.getDirectoryHandle(name, {
    create: true
  });

  // 複製失敗時保留來源
  await copyFolder(source, target);

  const verified = await compareFolders(source, target);

  if (!verified) {
    throw new Error("複製驗證失敗，來源資料夾已保留");
  }

  // 完整驗證成功後才刪除來源
  await sourceParent.removeEntry(name, { recursive: true });

  card.remove();
  cardTemplates.delete(path);

  const index = all.findIndex(item => item.path === path);

  if (index !== -1) {
    all.splice(index, 1);
  }

  alert(`移動成功：${targetPath}`);
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
  const button = event.target.closest('[data-action="delete"], [data-action="move"]');

  if (!button) return;

  event.preventDefault();
  event.stopPropagation();

  const card = button.closest("[data-item-path]");
  if (!card) return;

  button.disabled = true;

  try {
    if (button.dataset.action === "move") {
      await moveComic(card);
    } else {
      await deleteComic(card);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      const action = button.dataset.action === "move" ? "移動" : "刪除";
      alert(`${action}失敗：${error.message}`);
    }
  } finally {
    button.disabled = false;
  }
});
