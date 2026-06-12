document.addEventListener("DOMContentLoaded", initAlbum);

async function initAlbum() {
  const uploadForm = document.querySelector("#upload-form");
  const imageListContainer = document.querySelector("#image-list");

  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUpload);
  }

  await renderImageList(imageListContainer);
}

async function handleUpload(event) {
  event.preventDefault();

  const fileInput = event.target.querySelector("#image-file");
  const file = fileInput.files[0];

  if (!file) {
    showToast("업로드할 이미지를 선택해주세요.");
    return;
  }

  const ext = file.name.split('.').pop();
  const rid = roomId || "global";
  const safeName = `${rid}/${crypto.randomUUID()}.${ext}`;

  try {
    const session = readSBSession();
    if (!session?.access_token) {
      showToast("로그인이 필요합니다.");
      return;
    }

    const res = await fetch(
      `https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/image/${safeName}`,
      {
        method: "POST",
        headers: {
          apikey: "sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: file,
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("업로드 에러:", res.status, errText);
      if (errText.includes("Bucket not found")) {
        showToast("Supabase Storage에 'image' 버킷을 먼저 생성해 주세요.");
      } else if (errText.includes("row-level security") || res.status === 401 || res.status === 403) {
        showToast("업로드 권한이 없습니다. Supabase Storage 'image' 버킷의 RLS를 비활성화해 주세요.");
      } else {
        showToast("이미지 업로드에 실패했습니다.");
      }
      return;
    }

    showToast("사진이 업로드되었습니다.");
    event.target.reset();

    addAlbumImage(safeName);

    const container = document.querySelector("#image-list");
    removePlaceholder(container);
    await appendImageCard(container, safeName);

  } catch (err) {
    console.error("예외 발생:", err);
  }
}

function removePlaceholder(container) {
  const ph = container.querySelector("p.text-center.text-muted.py-4");
  if (ph) ph.remove();
}

async function renderImageList(container) {
  renderFromLocalStorage(container);
}

function renderFromLocalStorage(container) {
  const names = getAlbumList();
  if (!names.length) {
    container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
    return;
  }
  container.innerHTML = "";
  names.forEach(name => appendImageCard(container, name));
}

async function appendImageCard(container, name) {
  const colDiv = document.createElement("div");
  colDiv.className = "col-6 col-md-4";

  const imgDiv = document.createElement("div");
  imgDiv.className = "card album-card h-100";

  const img = document.createElement("img");
  img.className = "album-img";
  img.alt = name;
  img.loading = "lazy";

  // Supabase SDK로 인증된 이미지 로드 시도
  try {
    const { data, error } = await supabaseClient.storage.from('image').download(name);
    if (data) {
      img.src = URL.createObjectURL(data);
    } else {
      throw error || new Error("download failed");
    }
  } catch {
    // fallback: public URL
    img.src = "https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/public/image/" + name;
    img.onerror = () => {
      img.alt = '이미지를 불러올 수 없습니다';
      img.style.filter = 'grayscale(1)';
    };
  }

  imgDiv.appendChild(img);

  const body = document.createElement("div");
  body.className = "card-body p-2 text-center";
  body.innerHTML = `
    <small class="text-muted text-truncate d-block">${name}</small>
    <button class="btn btn-sm btn-outline-danger mt-1 image-delete" data-name="${name}">삭제</button>
  `;
  body.querySelector(".image-delete").addEventListener("click", () => {
    handleImageDelete(name, colDiv);
  });

  imgDiv.appendChild(body);
  colDiv.appendChild(imgDiv);
  container.append(colDiv);
}

const ALBUM_KEY = () => `motrip:album:${roomId || "global"}:images`;

function getAlbumList() {
  try {
    return JSON.parse(localStorage.getItem(ALBUM_KEY()) || "[]");
  } catch {
    return [];
  }
}

function addAlbumImage(name) {
  const list = getAlbumList();
  if (!list.includes(name)) {
    list.push(name);
    localStorage.setItem(ALBUM_KEY(), JSON.stringify(list));
  }
}

function removeAlbumImage(name) {
  const list = getAlbumList().filter(n => n !== name);
  localStorage.setItem(ALBUM_KEY(), JSON.stringify(list));
}

async function handleImageDelete(name, colDiv) {
  if (!confirm("이 이미지를 삭제하시겠습니까?")) return;

  // localStorage에서 먼저 제거 (Supabase Storage 삭제는 RLS 문제로 실패 가능)
  removeAlbumImage(name);
  colDiv.remove();
  showToast("이미지가 삭제되었습니다.");

  const container = document.querySelector("#image-list");
  if (container && !container.children.length) {
    container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
  }

  // Supabase Storage 삭제 시도 (실패해도 무시)
  try {
    const session = readSBSession();
    if (session?.access_token) {
      await supabaseClient.storage.from('image').remove([name]);
    }
  } catch {
    // Storage 삭제 실패는 무시 (localStorage에서 이미 제거됨)
  }
}
