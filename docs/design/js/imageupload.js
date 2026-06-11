/**
 * imageupload.js - 앨범 이미지 업로드 및 목록 조회 기능 모듈
 * 협업을 위해 50자 이내의 한글 주석을 포함하여 각 라인/변수 설명
 */

// DOM 요소가 모두 로드된 후 실행되도록 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", initAlbum);

/**
 * 앨범 초기화 함수
 * Supabase에서 이미지를 가져오고 이벤트 리스너를 설정
 */
async function initAlbum() {
  // 폼 및 목록 컨테이너 요소 가져오기
  const uploadForm = document.querySelector("#upload-form");
  const imageListContainer = document.querySelector("#image-list");

  // 업로드 폼 submit 이벤트 핸들러 연결
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUpload);
  }

  // 초기 이미지 목록 렌더링 호출
  await renderImageList(imageListContainer);
}

/**
 * 이미지 업로드 이벤트 핸들러
 * @param {Event} event - submit 이벤트 객체
 */
async function handleUpload(event) {
  // 폼 기본 제출 방지 (페이지 새로고침 방지)
  event.preventDefault();

  // 파일 입력 요소와 선택된 파일 가져오기
  const fileInput = event.target.querySelector("#image-file");
  const file = fileInput.files[0];

  // 파일이 선택되지 않은 경우 알림 후 종료
  if (!file) {
    alert("업로드할 이미지를 선택해주세요.");
    return;
  }

  // 충돌 방지를 위한 랜덤 파일명 생성 (uuid-기존파일명)
  const newFileName = `${crypto.randomUUID()}-${file.name}`;
  const bucketName = "image"; // Supabase 스토리지 버킷 이름

  try {
    // Supabase 스토리지에 파일 업로드 요청
    const { data, error } = await supabaseClient
      .storage
      .from(bucketName)
      .upload(newFileName, file);

    // 업로드 실패 시 에러 처리
    if (error) {
      console.error("업로드 에러:", error);
      if (error.message?.includes("Bucket not found")) {
        showToast("Supabase에 'image' 버킷을 먼저 생성해 주세요.");
      } else {
        showToast("이미지 업로드에 실패했습니다.");
      }
      return;
    }

    // 성공 시 알림 및 폼 초기화
    showToast("사진이 업로드되었습니다.");
    event.target.reset();

    // 새 이미지가 포함된 목록 다시 렌더링
    const imageListContainer = document.querySelector("#image-list");
    await renderImageList(imageListContainer);

  } catch (err) {
    // 예기치 않은 예외 발생 시 에러 로깅
    console.error("예외 발생:", err);
  }
}

/**
 * 이미지 목록을 조회하여 화면에 렌더링하는 함수
 * @param {HTMLElement} container - 이미지가 표시될 부모 요소
 */
async function renderImageList(container) {
  const bucketName = "image"; // 접근할 버킷 이름

  try {
    // 빈 문자열("") 경로로 해당 버킷의 파일 목록 조회
    const { data: imageList, error } = await supabaseClient
      .storage
      .from(bucketName)
      .list("");

    // 조회 실패 시 에러 로깅 후 종료
    if (error) {
      console.error("목록 조회 에러:", error);
      container.innerHTML = error.message?.includes("Bucket not found")
        ? "<p class='text-warning text-center'>Supabase Storage에 'image' 버킷을 생성해 주세요.</p>"
        : "<p class='text-danger text-center'>이미지를 불러오지 못했습니다.</p>";
      return;
    }

    // 조회된 이미지가 없을 경우 빈 상태 메시지 표시
    if (!imageList || imageList.length === 0) {
      container.innerHTML = "<p class='text-muted text-center'>업로드된 이미지가 없습니다.</p>";
      return;
    }

    // 기존 내용을 비우고 렌더링 준비
    container.innerHTML = "";

    // 파일 목록을 순회하며 카드 DOM 생성
    for (const image of imageList) {
      // .emptyFolderPlaceholder 등 쓰레기 데이터 건너뛰기
      if (image.name === ".emptyFolderPlaceholder") continue;

      // 파일명을 통해 Public URL(외부 접근 가능 주소) 획득
      const { data: urlData } = supabaseClient
        .storage
        .from(bucketName)
        .getPublicUrl(image.name);

      const publicUrl = urlData.publicUrl;

      // 컬럼 및 카드 역할을 할 div 생성 (Bootstrap Grid)
      const colDiv = document.createElement("div");
      colDiv.className = "col-6 col-md-4"; // 모바일 2열, PC 3열

      // 카드 DOM 구조 문자열 템플릿 작성
      colDiv.innerHTML = `
        <div class="card album-card h-100">
          <img src="${publicUrl}" class="album-img" alt="${image.name}" />
          <div class="card-body p-2 text-center">
            <small class="text-muted text-truncate d-block">${image.name}</small>
          </div>
        </div>
      `;

      // 컨테이너에 완성된 열(col) 삽입
      container.append(colDiv);
    }
  } catch (err) {
    // 예외 상황에 대한 안전망
    console.error("렌더링 예외 발생:", err);
  }
}
