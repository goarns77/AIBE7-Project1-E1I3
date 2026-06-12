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

    // 전체 목록을 다시 렌더링
    const container = document.querySelector("#image-list");
    await renderFromSupabase(container);

  } catch (err) {
    console.error("예외 발생:", err);
  }
}

async function renderImageList(container) {
  await renderFromSupabase(container);
}

async function renderFromSupabase(container) {
  const rid = roomId || "global";
  try {
    const { data, error } = await supabaseClient.storage.from('image').list(rid);
    
    if (error) {
      console.error(error);
      container.innerHTML = "<p class='text-center text-muted py-4'>이미지를 불러오지 못했습니다.</p>";
      return;
    }

    const files = data.filter(f => f.name !== '.emptyFolderPlaceholder');
    
    if (!files.length) {
      container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
      return;
    }
    
    container.innerHTML = "";
    files.forEach(file => {
      const name = `${rid}/${file.name}`;
      appendImageCard(container, name);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class='text-center text-muted py-4'>오류가 발생했습니다.</p>";
  }
}

function appendImageCard(container, name) {
  const colDiv = document.createElement("div");
  colDiv.className = "col-6 col-md-4";

  const publicUrl = "https://porvghadkgpamnvbuyqu.supabase.co/storage/v1/object/public/image/" + name;

  colDiv.innerHTML = `
    <div class="card album-card h-100">
      <img src="${publicUrl}" class="album-img" alt="${name}" loading="lazy"
           onerror="this.alt='이미지를 불러올 수 없습니다';this.style.filter='grayscale(1)';">
      <div class="card-body p-2 text-center">
        <small class="text-muted text-truncate d-block">${name}</small>
        <button class="btn btn-sm btn-outline-danger mt-1 image-delete" data-name="${name}">삭제</button>
      </div>
    </div>
  `;
  colDiv.querySelector(".image-delete").addEventListener("click", () => {
    handleImageDelete(name, colDiv);
  });
  container.append(colDiv);
}

async function handleImageDelete(name, colDiv) {
  if (!confirm("이 이미지를 삭제하시겠습니까?")) return;

  // Supabase Storage 삭제 시도
  try {
    const session = readSBSession();
    if (session?.access_token) {
      const { error } = await supabaseClient.storage.from('image').remove([name]);
      if (error) throw error;
      
      colDiv.remove();
      showToast("이미지가 삭제되었습니다.");

      const container = document.querySelector("#image-list");
      if (container && !container.children.length) {
        container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
      }
    } else {
      showToast("로그인이 필요합니다.");
    }
  } catch (err) {
    console.error(err);
    showToast("이미지 삭제에 실패했습니다.");
  }
}
