
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

async function validateOutputFolder(handle) {
  const name = viewerPath.replace(/[\\/]+$/, "").split(/[\\/]/).pop();

  try {
    await handle.getFileHandle(".snapshot.json");
    await handle.getFileHandle(`${name}.html`);
  } catch {
    throw new Error(`請選擇正確的 HTML 輸出資料夾：${name}`);
  }
}

let outputFolderHandle = null;

async function getOutputFolderHandle() {
  if (outputFolderHandle) {
    const permission = await outputFolderHandle.queryPermission({
      mode: "readwrite"
    });

    if (permission === "granted") {
      await validateOutputFolder(outputFolderHandle);
      return outputFolderHandle;
    }
  }

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("comic-viewer", 1);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const savedHandle = await new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const request = tx.objectStore("settings").get(`output:${viewerPath}`);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  if (savedHandle) {
    let permission = await savedHandle.queryPermission({
      mode: "readwrite"
    });

    if (permission !== "granted") {
      permission = await savedHandle.requestPermission({
        mode: "readwrite"
      });
    }

    if (permission === "granted") {
      await validateOutputFolder(savedHandle);

      db.close();
      outputFolderHandle = savedHandle;
      return savedHandle;
    }
  }

  const handle = await window.showDirectoryPicker({
    id: "comic-viewer-output",
    mode: "readwrite",
    ...(savedHandle ? { startIn: savedHandle } : {})
  });

  await validateOutputFolder(handle);

  await new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put(handle, `output:${viewerPath}`);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  outputFolderHandle = handle;
  return handle;
}

async function copyFolder(source, destination) {
  const tasks = [];

  for await (const [name, entry] of source.entries()) {
    if (entry.kind === "directory") {
      const child = await destination.getDirectoryHandle(name, {
        create: true
      });

      tasks.push(() => copyFolder(entry, child));
    } else {
      tasks.push(async () => {
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
      });
    }
  }

  // 同時最多複製 8 個檔案
  const workers = Array.from(
    { length: Math.min(4, tasks.length) },
    async () => {
      while (tasks.length) {
        const task = tasks.shift();
        await task();
      }
    }
  );

  await Promise.all(workers);
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

async function scanDirectory(folder) {
  const folders = [];
  const images = [];
  const imageExts = /\.(jpg|jpeg|png|webp)$/i;

  for await (const [name, entry] of folder.entries()) {
    if (entry.kind !== "directory") continue;

    const imageFiles = [];

    for await (const [fileName, child] of entry.entries()) {
      if (child.kind === "file" && imageExts.test(fileName)) {
        imageFiles.push(fileName);
      }
    }

    imageFiles.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    const item = {
      name,
      type: imageFiles.length ? "image" : "folder",
      images: imageFiles
    };

    if (item.type === "image") {
      images.push(item);
    } else {
      folders.push(item);
    }
  }

  const sort = (a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base"
    });

  return [...folders.sort(sort), ...images.sort(sort)];
}

function toFileUrl(path) {
  const normalized = path.replace(/\\/g, "/");

  return "file:///" + normalized
    .split("/")
    .map((part, index) =>
      index === 0 ? part : encodeURIComponent(part)
    )
    .join("/");
}

async function regenerateIndex(folder, folderPath) {
  const output = await getOutputFolderHandle();

  let directory = output;

  for (const part of folderPath) {
    directory = await directory.getDirectoryHandle(part);
  }

  const htmlName = folderPath.length === 0
    ? `${output.name}.html`
    : "index.html";

  const file = await directory.getFileHandle(htmlName);
  const content = await (await file.getFile()).text();

  const doc = new DOMParser().parseFromString(content, "text/html");
  const images = [...doc.querySelectorAll("img[src]")];
  const list = doc.querySelector("#list");

  if (!list) {
    throw new Error(`找不到 ${htmlName} 的漫畫列表`);
  }

  const items = await scanDirectory(folder);
  const cards = [];
  const searchItems = [];

  for (const item of items) {
    const path = [...folderPath, item.name].join("/");
    const link = item.type === "folder"
    ? `${encodeURIComponent(item.name)}/index.html`
    : `${encodeURIComponent(item.name)}.html`;

    const thumb = item.type === "image"
      ? toFileUrl([
          viewerPath,
          ...folderPath,
          item.name,
          item.images[0]
        ].join("/"))
      : "";

    const card = renderItem(item, path, link, thumb);

    cards.push(card);

    searchItems.push({
      name: item.name,
      type: item.type,
      link,
      thumb,
      path
    });
  }

  list.replaceChildren(...cards.map(card => doc.importNode(card, true)));

  const scripts = [...doc.querySelectorAll("script")];

  const searchScript = scripts.find(script =>
    script.textContent.includes("const all = ")
  );

  if (!searchScript) {
    throw new Error(`${htmlName} 找不到搜尋資料`);
  }

  searchScript.textContent = searchScript.textContent.replace(
    /const all = \[[\s\S]*?\];/,
    () => `const all = ${JSON.stringify(searchItems)};`
  );

  return {
    doc,
    htmlName,
    folderPath,
    searchItems
  };
}

async function writeIndexHtml(result) {
  const output = await getOutputFolderHandle();

  let directory = output;

  for (const part of result.folderPath) {
    directory = await directory.getDirectoryHandle(part);
  }

  const file = await directory.getFileHandle(result.htmlName);

  const writable = await file.createWritable();

  try {
    await writable.write(
      "<!DOCTYPE html>\n" + result.doc.documentElement.outerHTML
    );

    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

async function regenerateChapter(oldPath, newPath) {
  const output = await getOutputFolderHandle();
  const parts = oldPath.split("/");
  const name = parts.at(-1);
  const htmlName = `${name}.html`;

  let directory = output;

  for (const part of parts.slice(0, -1)) {
    directory = await directory.getDirectoryHandle(part);
  }

  const file = await directory.getFileHandle(htmlName);
  const content = await (await file.getFile()).text();
  const doc = new DOMParser().parseFromString(content, "text/html");
  const images = [...doc.querySelectorAll("img[src]")];

  const oldPrefix = toFileUrl(`${viewerPath}/${oldPath}/`);
  const newPrefix = toFileUrl(`${viewerPath}/${newPath}/`);
  const url = new URL(location.href);
  const segments = url.pathname.split("/");

  const outputIndex = segments.findIndex(
    segment => decodeURIComponent(segment) === output.name
  );

  if (outputIndex === -1) {
    throw new Error("無法定位 HTML 輸出根目錄");
  }

  const outputRootUrl = new URL(url.href);
  outputRootUrl.pathname =
    segments.slice(0, outputIndex + 1).join("/") + "/";

  const baseUrl = new URL(
    [...parts.slice(0, -1), htmlName]
      .map(encodeURIComponent)
      .join("/"),
    outputRootUrl
  );

  let updated = 0;

  for (const img of images) {
    const src = img.getAttribute("src");
    const absoluteUrl = new URL(src, baseUrl).href;

    const oldPathDecoded = decodeURI(oldPrefix);
    const absoluteDecoded = decodeURI(absoluteUrl);

    if (!absoluteDecoded.startsWith(oldPathDecoded)) continue;

    const relativePath = absoluteDecoded.slice(oldPathDecoded.length);

    img.setAttribute("src", newPrefix + relativePath);
    updated++;
  }

  for (const element of doc.querySelectorAll('link[href], script[src]')) {
    const attribute = element.hasAttribute("href") ? "href" : "src";
    const value = element.getAttribute(attribute);

    if (!value) continue;

    element.setAttribute(
      attribute,
      new URL(value, baseUrl).href
    );
  }

  const destinationParent = newPath.split("/").slice(0, -1);

  const indexName = destinationParent.length === 0
    ? `${output.name}.html`
    : "index.html";

  const parentIndexUrl = encodeURIComponent(indexName);

  for (const script of doc.querySelectorAll("script:not([src])")) {
    if (!script.textContent.includes("const parentIndex =")) continue;

    script.textContent = script.textContent.replace(
      /const parentIndex = "[^"]*";/,
      `const parentIndex = ${JSON.stringify(parentIndexUrl)};`
    );

    break;
  }

  const backLink = doc.querySelector("#back a[href]");

  if (backLink) {
    backLink.setAttribute("href", parentIndexUrl);
  }

  return { doc, htmlName, newPath, updated };
}

async function writeChapterHtml(result) {
  const output = await getOutputFolderHandle();

  let directory = output;

  for (const part of result.newPath.split("/").slice(0, -1)) {
    directory = await directory.getDirectoryHandle(part, {
      create: true
    });
  }

  const file = await directory.getFileHandle(result.htmlName, {
    create: true
  });

  const writable = await file.createWritable();

  try {
    await writable.write(
      "<!DOCTYPE html>\n" + result.doc.documentElement.outerHTML
    );

    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}

function renderItem(item, path, link, thumb) {
  const template = cardTemplates.values().next().value;

  if (!template) {
    throw new Error("找不到漫畫卡片樣板");
  }

  const card = template.cloneNode(true);

  card.dataset.itemPath = JSON.stringify(path);

  const anchor = card.querySelector("a");
  anchor.href = link;

  const title = anchor.querySelector("div:last-child");
  title.textContent = item.name;

  const cover = anchor.querySelector("img, .folder-thumb");

  if (item.type === "image") {
    const img = document.createElement("img");

    img.className = "w-full aspect-[3/4] object-cover";
    img.src = thumb;

    cover.replaceWith(img);
  } else {
    const folder = document.createElement("div");

    folder.className = "folder-thumb";
    folder.textContent = "📁";

    cover.replaceWith(folder);
  }

  return card;
}

async function hasOutputPermission() {
  if (outputFolderHandle) {
    return (await outputFolderHandle.queryPermission({
      mode: "readwrite"
    })) === "granted";
  }

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("comic-viewer", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const savedHandle = await new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readonly");
    const request = tx.objectStore("settings").get(`output:${viewerPath}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  db.close();

  if (!savedHandle) return false;

  const permission = await savedHandle.queryPermission({
    mode: "readwrite"
  });

  if (permission !== "granted") return false;

  await validateOutputFolder(savedHandle);
  outputFolderHandle = savedHandle;
  return true;
}


async function relocateComicHtml(source, oldPath, newPath) {
  const output = await getOutputFolderHandle();
  const items = await scanDirectory(source);

  let containsImages = false;

  for await (const [name, entry] of source.entries()) {
    if (entry.kind === "file" && /\.(jpg|jpeg|png|webp)$/i.test(name)) {
      containsImages = true;
      break;
    }
  }

  if (containsImages) {
    const chapter = await regenerateChapter(oldPath, newPath);

    if (chapter.updated === 0) {
      throw new Error(`閱讀頁未更新圖片：${oldPath}`);
    }

    await writeChapterHtml(chapter);
    return;
  }

  let oldDir = output;

  for (const part of oldPath.split("/")) {
    oldDir = await oldDir.getDirectoryHandle(part);
  }

  const oldFile = await oldDir.getFileHandle("index.html");
  const content = await (await oldFile.getFile()).text();
  const doc = new DOMParser().parseFromString(content, "text/html");

  const url = new URL(location.href);
  const segments = url.pathname.split("/");

  const outputIndex = segments.findIndex(
    segment => decodeURIComponent(segment) === output.name
  );

  if (outputIndex === -1) {
    throw new Error("無法定位 HTML 輸出根目錄");
  }

  const outputRootUrl = new URL(url.href);

  outputRootUrl.pathname =
    segments.slice(0, outputIndex + 1).join("/") + "/";

  const oldBase = new URL(
    [...oldPath.split("/"), "index.html"]
      .map(encodeURIComponent)
      .join("/"),
    outputRootUrl
  );

  for (const element of doc.querySelectorAll('link[href], script[src]')) {
    const attribute = element.hasAttribute("href") ? "href" : "src";
    const value = element.getAttribute(attribute);

    if (value) {
      element.setAttribute(attribute, new URL(value, oldBase).href);
    }
  }

  const parent = newPath.split("/").slice(0, -1);

  const parentIndex = parent.length === 0
    ? `../${encodeURIComponent(output.name)}.html`
    : "../index.html";

  const back = doc.querySelector("#back a[href]");

  if (back) {
    back.setAttribute("href", parentIndex);
  }

  let newDir = output;

  for (const part of newPath.split("/")) {
    newDir = await newDir.getDirectoryHandle(part, { create: true });
  }

  const newFile = await newDir.getFileHandle("index.html", {
    create: true
  });

  const writable = await newFile.createWritable();

  try {
    await writable.write(
      "<!DOCTYPE html>\n" + doc.documentElement.outerHTML
    );
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }

  for (const item of items) {
    const child = await source.getDirectoryHandle(item.name);

    await relocateComicHtml(
      child,
      `${oldPath}/${item.name}`,
      `${newPath}/${item.name}`
    );
  }

  const indexResult = await regenerateIndex(
    source,
    newPath.split("/")
  );

  await writeIndexHtml(indexResult);
}

async function moveComic(card) {
  console.time("搬移總時間");

  if (!(await hasOutputPermission())) {
    alert("HTML 輸出資料夾尚未授權，請先授權再移動漫畫。");
    return;
  }

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

  console.time("1. 複製檔案");
  // 複製失敗時保留來源
  await copyFolder(source, target);

  console.timeEnd("1. 複製檔案");

  console.time("2. SHA-256 驗證");

  const verified = await compareFolders(source, target);

  console.timeEnd("2. SHA-256 驗證");

  if (!verified) {
    throw new Error("複製驗證失敗，來源資料夾已保留");
  }

  console.time("3. 更新搬移後的 HTML");

  await relocateComicHtml(source, path, targetPath);

  const indexResult = await regenerateIndex(
    destination,
    destinationPath
  );

  await writeIndexHtml(indexResult);

  console.timeEnd("3. 更新搬移後的 HTML");

  console.time("7. 刪除來源");

  // 完整驗證成功後才刪除來源
  await sourceParent.removeEntry(name, { recursive: true });

  const sourceIndex = await regenerateIndex(sourceParent, sourcePath);
  await writeIndexHtml(sourceIndex);

  console.timeEnd("7. 刪除來源");

  card.remove();
  cardTemplates.delete(path);

  const index = all.findIndex(item => item.path === path);

  if (index !== -1) {
    all.splice(index, 1);
  }

  console.timeEnd("搬移總時間");
  alert(`移動成功：${targetPath}`);
}

async function deleteComic(card) {
  if (!(await hasOutputPermission())) {
    alert("HTML 輸出資料夾尚未授權，請先授權再刪除漫畫。");
    return;
  }

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

  const sourceIndex = await regenerateIndex(parent, parts.slice(0, -1));
  await writeIndexHtml(sourceIndex);

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

document.getElementById("authorize-output").addEventListener("click", async () => {
  try {
    await getOutputFolderHandle();
    alert("HTML 輸出資料夾授權成功");
  } catch (error) {
    if (error.name !== "AbortError") {
      alert(`授權失敗：${error.message}`);
    }
  }
});

document.getElementById("authorize-library").addEventListener("click", async () => {
  try {
    await getLibraryHandle();
    alert("漫畫庫授權成功");
  } catch (error) {
    if (error.name !== "AbortError") {
      alert(`漫畫庫授權失敗：${error.message}`);
    }
  }
});
