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
  const safeName = `${crypto.randomUUID()}.${ext}`;

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

    // 업로드된 이미지를 목록에 직접 추가 (리스트 API는 RLS 차단 가능성)
    const container = document.querySelector("#image-list");
    // 처음 업로드면 안내 메시지 제거
    if (container.querySelector(".text-muted")) container.innerHTML = "";
    const publicUrl = "https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/public/image/" + safeName;
    const colDiv = document.createElement("div");
    colDiv.className = "col-6 col-md-4";
    colDiv.innerHTML = `
      <div class="card album-card h-100">
        <img src="${publicUrl}" class="album-img" alt="${safeName}" loading="lazy"
             onerror="this.alt='이미지를 불러올 수 없습니다';this.style.filter='grayscale(1)';">
        <div class="card-body p-2 text-center">
          <small class="text-muted text-truncate d-block">${safeName}</small>
        </div>
      </div>
    `;
    container.append(colDiv);

  } catch (err) {
    console.error("예외 발생:", err);
  }
}

async function renderImageList(container) {
  try {
    const session = readSBSession();
    if (!session?.access_token) return;

    const res = await fetch(
      "https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/list/image",
      {
        method: "POST",
        headers: {
          apikey: "sb_publishable_cpvF4f7QZzxK16Q_-JNM5A_czghLSxK",
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefix: "", limit: 100, offset: 0 }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("목록 조회 에러:", errText);
      container.innerHTML = errText.includes("Bucket not found")
        ? "<p class='text-warning text-center'>Supabase Storage에 'image' 버킷을 생성해 주세요.</p>"
        : "<p class='text-danger text-center'>이미지를 불러오지 못했습니다. 버킷이 public인지 확인해 주세요.</p>";
      return;
    }

    const imageList = await res.json();

    if (!imageList || imageList.length === 0) {
      container.innerHTML = "<p class='text-muted text-center'>업로드된 이미지가 없습니다.</p>";
      return;
    }

    container.innerHTML = "";

    const baseUrl = "https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/public/image/";

    for (const image of imageList) {
      if (image.name === ".emptyFolderPlaceholder") continue;
      const publicUrl = baseUrl + image.name;
      const colDiv = document.createElement("div");
      colDiv.className = "col-6 col-md-4";
      colDiv.innerHTML = `
        <div class="card album-card h-100">
          <img src="${publicUrl}" class="album-img" alt="${image.name}" loading="lazy"
               onerror="this.alt='이미지를 불러올 수 없습니다';this.style.filter='grayscale(1)';">
          <div class="card-body p-2 text-center">
            <small class="text-muted text-truncate d-block">${image.name}</small>
          </div>
        </div>
      `;
      container.append(colDiv);
    }
  } catch (err) {
    console.error("렌더링 예외 발생:", err);
  }
}
