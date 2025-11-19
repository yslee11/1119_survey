/***** ✅ 사용자가 직접 수정해야 하는 부분 *****/

// GitHub 저장소 정보
const GITHUB = {
  owner: "yslee11",    // ✅ 본인 깃허브 ID
  repo: "1119_survey",           // ✅ 저장소 이름
  branch: "main",                   // ✅ 브랜치 (보통 main)
  path: "images"                    // ✅ 이미지 폴더 이름
};

// Google Apps Script Web App URL
// ✅ Apps Script 배포 후 여기에 URL을 붙여넣으세요
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwyx8WPaQu2tEmJVvVHMnaLUtN52Si6yLU2bIxbuovzKlcqgIXvHfq_ZnjHfkWQO81y/exec";

// 📌 평가 항목 설정 (자유롭게 추가/수정 가능)
const RATING_CATEGORIES = [
  { name: 'safety', label: '🛡️ 안전성', question: '이 장소는 안전하다고 느껴진다' },
  { name: 'comfort', label: '🌿 쾌적성', question: '이 장소는 쾌적하다고 느껴진다' },
  { name: 'convenience', label: '🚶 편리성', question: '이 장소는 보행하기 편리하다' },
  { name: 'accessibility', label: '♿ 접근성', question: '이 장소는 접근하기 쉽다' },
  { name: 'aesthetics', label: '🎨 심미성', question: '이 장소는 심미적으로 아름답다' },
  { name: 'activity', label: '🎪 활동성', question: '이 장소는 다양한 활동이 가능하다' }
];

// 각 그룹별 평가할 이미지 개수
// 예: 10대 남성은 3개, 10대 여성은 3개씩 평가 (다음 참가자는 4,5,6번)
const IMAGES_PER_GROUP = 3;

/*****************************************************/

// 전역 변수
let currentImage = 0;
let responses = [];
let participant = { gender: "", age: "" };
let selectedImages = [];
let startTime = null;
const userID = generateUserID();
let allAvailableImages = [];
let participantImageRange = { start: 0, end: 0 };

/**
 * 고유한 사용자 ID 생성
 */
function generateUserID() {
  return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * 이미지 URL에서 이미지 ID 추출
 */
function getImageID(url) {
  return url.split('/').pop();
}

/**
 * 페이지 전환
 */
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  window.scrollTo(0, 0);
}

/**
 * GitHub API를 통해 이미지 목록 가져오기
 */
async function getImageList() {
  try {
    const api = `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.repo}/git/trees/${GITHUB.branch}?recursive=1`;
    const res = await fetch(api);
    
    if (!res.ok) {
      throw new Error(`GitHub API 오류: ${res.status}`);
    }
    
    const data = await res.json();
    
    // 이미지 파일만 필터링
    const exts = /\.(jpg|jpeg|png|webp|gif)$/i;
    const images = data.tree
      .filter(item => 
        item.type === "blob" && 
        item.path.startsWith(`${GITHUB.path}/`) && 
        exts.test(item.path)
      )
      .map(item => 
        `https://raw.githubusercontent.com/${GITHUB.owner}/${GITHUB.repo}/${GITHUB.branch}/${item.path}`
      );
    
    console.log(`총 ${images.length}개의 이미지를 찾았습니다.`);
    return images.sort(); // 이미지를 정렬해 순서 보장
    
  } catch (error) {
    console.error("이미지 목록 로딩 실패:", error);
    alert("❌ 이미지 목록을 불러오는데 실패했습니다.\n\nGitHub 설정을 확인해주세요:\n- 저장소가 Public인지 확인\n- GITHUB 정보가 정확한지 확인");
    throw error;
  }
}

/**
 * 로컬 스토리지에서 다음 사용자의 시작 인덱스 조회
 */
function getNextImageIndex() {
  const lastIndex = localStorage.getItem('lastImageIndex');
  return lastIndex ? parseInt(lastIndex) + 1 : 0;
}

/**
 * 로컬 스토리지에 마지막 이미지 인덱스 저장
 */
function saveLastImageIndex(index) {
  localStorage.setItem('lastImageIndex', index);
}

/**
 * 설문 초기화
 */
async function initSurvey() {
  try {
    startTime = new Date();
    
    // 첫 번째 사용자인 경우 모든 이미지 로드
    if (allAvailableImages.length === 0) {
      allAvailableImages = await getImageList();
      
      if (allAvailableImages.length === 0) {
        throw new Error("이미지가 없습니다.");
      }
    }
    
    // 현재 사용자가 평가할 이미지 범위 결정
    const startIdx = getNextImageIndex();
    const endIdx = Math.min(startIdx + IMAGES_PER_GROUP, allAvailableImages.length);
    
    // 범위를 벗어난 경우
    if (startIdx >= allAvailableImages.length) {
      alert("⚠️ 모든 이미지 평가가 완료되었습니다!\n\n더 이상 평가할 이미지가 없습니다.");
      showPage("intro-page");
      return;
    }
    
    participantImageRange = { start: startIdx, end: endIdx };
    selectedImages = allAvailableImages.slice(startIdx, endIdx);
    
    currentImage = 0;
    responses = [];
    
    console.log(`${participant.gender} ${participant.age}: 이미지 ${startIdx + 1}~${endIdx}번 평가 시작 (총 ${selectedImages.length}개)`);
    
    // 평가 항목 동적 생성
    generateRatingForm();
    await loadImage();
    
  } catch (error) {
    console.error("설문 초기화 실패:", error);
    alert("설문을 시작할 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.");
  }
}

/**
 * 평가 항목 폼 동적 생성
 */
function generateRatingForm() {
  const form = document.getElementById("score-form");
  form.innerHTML = "";
  
  RATING_CATEGORIES.forEach(category => {
    const section = document.createElement("div");
    section.className = "rating-section";
    
    const question = document.createElement("h4");
    question.className = "rating-question";
    question.textContent = `${category.label}: ${category.question}`;
    
    const scale = document.createElement("div");
    scale.className = "rating-scale";
    
    // 1~5 라디오 버튼 생성
    for (let i = 1; i <= 5; i++) {
      const label = document.createElement("label");
      label.className = "rating-option";
      
      const input = document.createElement("input");
      input.type = "radio";
      input.name = category.name;
      input.value = i.toString();
      if (i === 1) input.required = true;
      
      const span = document.createElement("span");
      span.className = "option-text";
      span.textContent = i;
      
      label.appendChild(input);
      label.appendChild(span);
      scale.appendChild(label);
      
      // 실시간 피드백
      input.addEventListener('change', () => {
        section.style.background = '#e8f4f8';
        setTimeout(() => {
          section.style.background = '#f8f9fa';
        }, 300);
      });
    }
    
    const labels = document.createElement("div");
    labels.className = "scale-labels";
    labels.innerHTML = '<span>매우 그렇지 않다</span><span>매우 그렇다</span>';
    
    section.appendChild(question);
    section.appendChild(scale);
    section.appendChild(labels);
    form.appendChild(section);
  });
}

/**
 * 이미지 로딩
 */
function loadImage() {
  return new Promise((resolve, reject) => {
    const img = document.getElementById("survey-image");
    const loadingEl = document.getElementById("loading");
    
    // 로딩 표시
    loadingEl.style.display = "block";
    img.style.display = "none";
    
    // 이미지 로드 완료
    img.onload = function() {
      loadingEl.style.display = "none";
      img.style.display = "block";
      updateProgress();
      clearAllRatings();
      updateButtonStates();
      resolve();
    };
    
    // 이미지 로드 실패
    img.onerror = function() {
      loadingEl.style.display = "none";
      loadingEl.innerHTML = '<p style="color: red;">❌ 이미지 로딩 실패</p>';
      loadingEl.style.display = "block";
      updateProgress();
      clearAllRatings();
      updateButtonStates();
      reject(new Error("이미지 로딩 실패"));
    };
    
    // 이미지 소스 설정
    img.src = selectedImages[currentImage];
  });
}

/**
 * 진행 상황 업데이트
 */
function updateProgress() {
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  
  const percentage = ((currentImage + 1) / selectedImages.length) * 100;
  progressFill.style.width = percentage + "%";
  progressText.textContent = `${currentImage + 1} / ${selectedImages.length}`;
}

/**
 * 모든 평가 항목 선택 초기화
 */
function clearAllRatings() {
  RATING_CATEGORIES.forEach(category => {
    document.querySelectorAll(`input[name="${category.name}"]`)
      .forEach(radio => radio.checked = false);
  });
}

/**
 * 모든 평가 항목이 선택되었는지 확인
 */
function areAllRatingsSelected() {
  return RATING_CATEGORIES.every(category => {
    const selected = document.querySelector(`input[name="${category.name}"]:checked`);
    return selected !== null;
  });
}

/**
 * 현재 선택된 모든 평가 점수 가져오기
 */
function getAllRatings() {
  const ratings = {};
  
  RATING_CATEGORIES.forEach(category => {
    const selected = document.querySelector(`input[name="${category.name}"]:checked`);
    ratings[category.name] = selected ? parseInt(selected.value) : null;
  });
  
  return ratings;
}

/**
 * 버튼 상태 업데이트
 */
function updateButtonStates() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  
  // 이전 버튼 (첫 번째 이미지에서는 비활성화)
  prevBtn.disabled = currentImage === 0;
  
  // 다음 버튼 텍스트 변경 (마지막 이미지에서는 "제출")
  if (currentImage >= selectedImages.length - 1) {
    nextBtn.textContent = "제출 완료 ✓";
    nextBtn.classList.add("submit-btn");
  } else {
    nextBtn.textContent = "다음 ▶";
    nextBtn.classList.remove("submit-btn");
  }
}

/**
 * 다음 질문으로 이동
 */
async function nextQuestion() {
  // 모든 항목이 선택되었는지 확인
  if (!areAllRatingsSelected()) {
    const unanswered = RATING_CATEGORIES
      .filter(cat => !document.querySelector(`input[name="${cat.name}"]:checked`))
      .map(cat => cat.label.replace(/^[🛡️🌿🚶♿🎨🎪]\s+/, ''))
      .join(', ');
    
    alert(`⚠️ 모든 항목을 평가해주세요!\n\n미평가 항목: ${unanswered}`);
    return;
  }

  // 응답 저장
  const ratings = getAllRatings();
  
  responses.push({
    timestamp: new Date().toISOString(),
    userID: userID,
    gender: participant.gender,
    age: participant.age,
    imageID: getImageID(selectedImages[currentImage]),
    imageIndex: participantImageRange.start + currentImage + 1,
    ...ratings
  });

  console.log(`이미지 ${currentImage + 1} 평가 완료:`, ratings);

  // 마지막 이미지인 경우 제출
  if (currentImage >= selectedImages.length - 1) {
    await submitSurvey();
    return;
  }

  // 다음 이미지로 이동
  currentImage++;
  await loadImage();
}

/**
 * 이전 질문으로 이동
 */
async function prevQuestion() {
  if (currentImage > 0) {
    currentImage--;
    
    // 이전 응답 제거
    responses.pop();
    
    await loadImage();
    
    // 이전에 선택했던 값 복원
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      RATING_CATEGORIES.forEach(category => {
        const value = lastResponse[category.name];
        if (value) {
          const radio = document.querySelector(`input[name="${category.name}"][value="${value}"]`);
          if (radio) radio.checked = true;
        }
      });
    }
  }
}

/**
 * 설문 제출
 */
async function submitSurvey() {
  try {
    console.log("제출 시작...");
    
    // 제출 데이터 준비
    const submitData = {
      participant: participant,
      userID: userID,
      responses: responses,
      metadata: {
        totalImages: selectedImages.length,
        submittedAt: new Date().toISOString(),
        startTime: startTime.toISOString(),
        imageRange: participantImageRange
      }
    };

    console.log("제출 데이터:", submitData);

    // JSONP 방식으로 전송
    await sendDataViaJSONP(submitData);
    
    // 마지막 이미지 인덱스 저장 (다음 참가자용)
    saveLastImageIndex(participantImageRange.end - 1);
    
    // 완료 페이지로 이동
    showCompletionPage();
    
  } catch (error) {
    console.error("제출 실패:", error);
    alert("❌ 제출 중 오류가 발생했습니다.\n\n" + error.message + "\n\n다시 시도해주세요.");
  }
}

/**
 * JSONP 방식으로 데이터 전송
 */
function sendDataViaJSONP(data) {
  return new Promise((resolve, reject) => {
    // 콜백 함수 이름 생성
    const callbackName = 'jsonpCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    
    // URL 생성
    const url = `${APPS_SCRIPT_URL}?callback=${callbackName}&data=${encodeURIComponent(JSON.stringify(data))}`;
    
    console.log("JSONP 요청 URL 길이:", url.length);
    
    // URL이 너무 길면 경고
    if (url.length > 8000) {
      console.warn("⚠️ URL이 너무 깁니다. 일부 브라우저에서 문제가 발생할 수 있습니다.");
    }
    
    // 글로벌 콜백 함수 정의
    window[callbackName] = function(result) {
      console.log("서버 응답:", result);
      
      // 타임아웃 정리
      if (timeoutId) clearTimeout(timeoutId);
      
      // script 태그 제거
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // 글로벌 함수 정리
      delete window[callbackName];
      
      // 결과 처리
      if (result && result.status === "success") {
        resolve(result);
      } else {
        reject(new Error(result ? result.message : "제출 실패"));
      }
    };

    // script 태그 생성
    const script = document.createElement('script');
    script.src = url;
    
    // 에러 처리
    script.onerror = function() {
      console.error("JSONP 요청 실패");
      
      if (timeoutId) clearTimeout(timeoutId);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      
      reject(new Error("네트워크 오류가 발생했습니다."));
    };
    
    // 타임아웃 설정 (30초)
    const timeoutId = setTimeout(() => {
      console.error("제출 타임아웃");
      
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window[callbackName];
      
      reject(new Error("제출 시간이 초과되었습니다."));
    }, 30000);
    
    // 요청 실행
    document.head.appendChild(script);
  });
}

/**
 * 완료 페이지 표시
 */
function showCompletionPage() {
  // 경과 시간 계산
  const endTime = new Date();
  const elapsedMinutes = Math.round((endTime - startTime) / 60000);
  
  // 정보 표시
  document.getElementById("total-images").textContent = selectedImages.length;
  document.getElementById("elapsed-time").textContent = elapsedMinutes + "분";
  
  // 완료 페이지로 전환
  showPage("end-page");
}

/**
 * 초기 상태로 리셋 (다음 참가자)
 */
function resetForNextParticipant() {
  participant = { gender: "", age: "" };
  currentImage = 0;
  responses = [];
  selectedImages = [];
  startTime = null;
  
  // 폼 초기화
  document.querySelectorAll('input[name="gender"]').forEach(r => r.checked = false);
  document.getElementById("age").value = "";
  
  showPage("intro-page");
}

/**
 * 이벤트 리스너 등록
 */
document.addEventListener("DOMContentLoaded", () => {
  // 시작 버튼
  document.getElementById("startBtn").addEventListener("click", () => {
    const gender = document.querySelector('input[name="gender"]:checked');
    const age = document.getElementById("age").value;
    
    if (!gender || !age) {
      alert("⚠️ 성별과 연령대를 모두 선택해주세요.");
      return;
    }
    
    participant.gender = gender.value;
    participant.age = age;
    
    console.log("참가자 정보:", participant);
    
    showPage("survey-page");
    initSurvey();
  });
  
  // 다음 버튼
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  
  // 이전 버튼
  document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  
  // 다음 참가자 버튼
  document.getElementById("nextParticipantBtn").addEventListener("click", () => {
    resetForNextParticipant();
  });
});
