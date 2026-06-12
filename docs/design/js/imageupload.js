document.addEventListener("DOMContentLoaded", initAlbum);

let albumCurrentUser = null;

async function initAlbum() {
  const uploadForm = document.querySelector("#upload-form");
  const imageListContainer = document.querySelector("#image-list");

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    albumCurrentUser = user;
  } catch {
    albumCurrentUser = null;
  }

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
    showToast("업로드할 이미지를 선택해 주세요.");
    return;
  }

  const ext = file.name.split(".").pop();
  const rid = roomId || "global";

  try {
    const session = readSBSession();
    if (!session?.access_token) {
      showToast("로그인이 필요합니다.");
      return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    albumCurrentUser = user;
    if (!user?.id) {
      showToast("로그인이 필요합니다.");
      return;
    }

    const safeName = buildImagePath(rid, user.id, ext);
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
        showToast("Supabase Storage의 'image' 버킷을 먼저 생성해 주세요.");
      } else if (errText.includes("row-level security") || res.status === 401 || res.status === 403) {
        showToast("이미지 업로드 권한이 없습니다. Storage 정책을 확인해 주세요.");
      } else {
        showToast("이미지 업로드에 실패했습니다.");
      }
      return;
    }

    showToast("사진이 업로드되었습니다.");
    event.target.reset();

    const container = document.querySelector("#image-list");
    await renderFromSupabase(container);
  } catch (err) {
    console.error("업로드 예외:", err);
    showToast("이미지 업로드에 실패했습니다.");
  }
}

async function renderImageList(container) {
  await renderFromSupabase(container);
}

async function renderFromSupabase(container) {
  const rid = roomId || "global";

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    albumCurrentUser = user;

    const { data, error } = await supabaseClient.storage.from("image").list(rid);
    if (error) {
      console.error(error);
      container.innerHTML = "<p class='text-center text-muted py-4'>이미지를 불러오지 못했습니다.</p>";
      return;
    }

    const files = (data || []).filter((file) => file.name !== ".emptyFolderPlaceholder");
    if (!files.length) {
      container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
      return;
    }

    container.innerHTML = "";
    await Promise.all(
      files.map(async (file) => {
        const name = `${rid}/${file.name}`;
        await appendImageCard(container, name, file);
      }),
    );
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class='text-center text-muted py-4'>오류가 발생했습니다.</p>";
  }
}

async function appendImageCard(container, name, file) {
  const colDiv = document.createElement("div");
  colDiv.className = "col-6 col-md-4";

  const ownerId = resolveImageOwnerId(name, file);
  const canDelete = Boolean(albumCurrentUser?.id && ownerId && ownerId === albumCurrentUser.id);
  const imageUrl = await getSignedImageUrl(name);

  colDiv.innerHTML = `
    <div class="card album-card h-100">
      <img src="${imageUrl}" class="album-img" alt="${displayImageName(name)}" loading="lazy"
           onerror="this.alt='이미지를 불러올 수 없습니다';this.style.filter='grayscale(1)';">
      <div class="card-body p-2 text-center">
        <small class="text-muted text-truncate d-block">${displayImageName(name)}</small>
        ${canDelete ? `<button class="btn btn-sm btn-outline-danger mt-1 image-delete" data-name="${name}">삭제</button>` : ""}
      </div>
    </div>
  `;

  const deleteButton = colDiv.querySelector(".image-delete");
  if (deleteButton) {
    deleteButton.addEventListener("click", () => {
      handleImageDelete(name, colDiv);
    });
  }

  container.append(colDiv);
}

async function handleImageDelete(name, colDiv) {
  if (!albumCurrentUser?.id) {
    showToast("로그인이 필요합니다.");
    return;
  }

  const ownerId = resolveImageOwnerId(name);
  if (ownerId && ownerId !== albumCurrentUser.id) {
    showToast("본인이 업로드한 이미지만 삭제할 수 있습니다.");
    return;
  }

  if (!confirm("이 이미지를 삭제하시겠습니까?")) return;

  try {
    const session = readSBSession();
    if (!session?.access_token) {
      showToast("로그인이 필요합니다.");
      return;
    }

    const { error } = await supabaseClient.storage.from("image").remove([name]);
    if (error) throw error;

    colDiv.remove();
    showToast("이미지가 삭제되었습니다.");

    const container = document.querySelector("#image-list");
    if (container && !container.children.length) {
      container.innerHTML = "<p class='text-center text-muted py-4'>업로드된 이미지가 없습니다.</p>";
    }
  } catch (err) {
    console.error(err);
    showToast("이미지 삭제에 실패했습니다.");
  }
}

function buildImagePath(roomKey, userId, ext) {
  const cleanExt = String(ext || "jpg").replace(/[^a-zA-Z0-9]/g, "") || "jpg";
  return `${roomKey}/${userId}__${crypto.randomUUID()}.${cleanExt}`;
}

function extractOwnerIdFromPath(path) {
  const fileName = String(path || "").split("/").pop() || "";
  const [prefix] = fileName.split("__");
  return /^[0-9a-f-]{36}$/i.test(prefix) ? prefix : null;
}

function resolveImageOwnerId(path, file = null) {
  if (file?.owner) return file.owner;
  if (file?.metadata?.owner) return file.metadata.owner;
  return extractOwnerIdFromPath(path);
}

function displayImageName(path) {
  const fileName = String(path || "").split("/").pop() || "";
  const parts = fileName.split("__");
  return parts.length > 1 ? parts.slice(1).join("__") : fileName;
}

async function getSignedImageUrl(path) {
  const { data, error } = await supabaseClient.storage.from("image").createSignedUrl(path, 3600);
  if (error) {
    console.error(error);
    return "";
  }
  return data?.signedUrl || "";
}
