# 보행환경 인식 설문조사 시스템 (다중 사용자 순차 평가)

한 이미지에 대해 여러 항목(안전성, 쾌적성, 편리성, 접근성, 심미성, 활동성)을 1-5점으로 평가하는 **다중 사용자 순차 평가** 설문조사 시스템입니다.

## 🎯 주요 특징

### ✅ 다중 사용자 순차 평가
- **10대 남성 1 → 이미지 1,2,3 평가**
- **10대 남성 2 → 이미지 4,5,6 평가**
- **10대 여성 1 → 이미지 7,8,9 평가**
- 각 그룹별로 할당된 이미지만 평가 (중복 없음)

### ✅ 동적 평가 항목
- 평가 항목을 자유롭게 추가/수정 가능
- 기본: 안전성, 쾌적성, 편리성, 접근성, 심미성, 활동성 (6개)

### ✅ 자동 버튼 비활성화
- 설문 완료 후 "제출 완료" 버튼 → 초록색으로 변경
- 다음 참가자가 다시 시작 가능

### ✅ Google Sheets 통합
- 모든 데이터 자동 저장
- 연령/성별별 통계 자동 계산

## 📋 평가 항목

| 항목 | 설명 |
|------|------|
| 🛡️ 안전성 | 이 장소는 안전하다고 느껴진다 |
| 🌿 쾌적성 | 이 장소는 쾌적하다고 느껴진다 |
| 🚶 편리성 | 이 장소는 보행하기 편리하다 |
| ♿ 접근성 | 이 장소는 접근하기 쉽다 |
| 🎨 심미성 | 이 장소는 심미적으로 아름답다 |
| 🎪 활동성 | 이 장소는 다양한 활동이 가능하다 |

## 🚀 설치 및 설정 방법

### 1단계: GitHub 저장소 준비

```bash
# GitHub에 새 저장소 생성 (Public으로 설정)

# 저장소 구조:
YOUR_REPO/
├── images/
│   ├── image1.jpg
│   ├── image2.jpg
│   ├── image3.jpg
│   └── ... (더 많은 이미지)
├── index.html
├── script.js
├── style.css
└── README.md
```

1. GitHub에 새 저장소 생성 (**반드시 Public**)
2. 저장소에 `images` 폴더 생성
3. `images` 폴더에 평가할 이미지 업로드 (jpg, png, webp 등)

### 2단계: Google Sheets 설정

1. Google Sheets에서 **새 스프레드시트** 생성
2. 스프레드시트 URL에서 ID 복사:
   ```
   https://docs.google.com/spreadsheets/d/[이부분이_SPREADSHEET_ID]/edit
   ```

3. **확장 프로그램 > Apps Script** 클릭
4. `app_script.gs` 파일의 모든 내용 복사 후 붙여넣기
5. 코드 상단의 `SPREADSHEET_ID` 수정:
   ```javascript
   const SPREADSHEET_ID = "여기에_복사한_ID_붙여넣기";
   ```

6. **배포 > 새 배포** 클릭
   - 유형: **웹 앱**
   - 실행: **나**
   - 액세스 권한: **모든 사용자**

7. 배포 후 생성된 **웹 앱 URL** 복사

### 3단계: 프론트엔드 코드 수정

`script.js`의 상단 설정 부분 수정:

```javascript
// GitHub 저장소 정보
const GITHUB = {
  owner: "본인의_GitHub_ID",        // 예: "johndoe"
  repo: "저장소_이름",               // 예: "survey-images"
  branch: "main",                   // 보통 "main"
  path: "images"                    // 이미지 폴더 이름
};

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "2단계에서_복사한_웹앱_URL_붙여넣기";

// 📌 각 참가자가 평가할 이미지 개수
const IMAGES_PER_GROUP = 3;  // 예: 10대 남1 → 3개, 10대 남2 → 3개
```

### 4단계: 평가 항목 커스터마이징

`script.js`에서 `RATING_CATEGORIES` 수정:

```javascript
const RATING_CATEGORIES = [
  { name: 'safety', label: '🛡️ 안전성', question: '이 장소는 안전하다고 느껴진다' },
  { name: 'comfort', label: '🌿 쾌적성', question: '이 장소는 쾌적하다고 느껴진다' },
  // ... 추가 항목 추가 가능
];
```

### 5단계: GitHub Pages로 배포

1. GitHub 저장소에 파일 업로드:
   - `index.html`
   - `script.js`
   - `style.css`

2. 저장소 **Settings > Pages**
   - Source: **Deploy from a branch**
   - Branch: **main**, 폴더: **/ (root)**
   - **Save** 클릭

3. 생성되는 URL로 접속:
   ```
   https://본인ID.github.io/저장소이름/
   ```

## 📊 데이터 흐름 예시

### 사용자 시나리오

```
🎯 총 20개의 이미지가 있고, IMAGES_PER_GROUP = 3일 경우:

참가자 1: 10대 남성
├─ 이미지 1, 2, 3 평가 ✅
└─ 저장된 index: 2 (다음은 3부터 시작)

참가자 2: 10대 남성
├─ 이미지 4, 5, 6 평가 ✅
└─ 저장된 index: 5

참가자 3: 10대 여성
├─ 이미지 7, 8, 9 평가 ✅
└─ 저장된 index: 8

... (계속)

참가자 7: 20대 남성
├─ 이미지 19, 20 평가 ✅
└─ 더 이상 이미지 없음 ⚠️
```

## 🗄️ Google Sheets 데이터 구조

### Responses 시트

| 타임스탬프 | 사용자 ID | 성별 | 연령대 | 이미지 ID | 이미지 순서 | 안전성 | 쾌적성 | 편리성 | 접근성 | 심미성 | 활동성 |
|----------|----------|-----|-------|----------|-----------|--------|--------|--------|--------|--------|--------|
| 2025-11-18... | user-123 | 남 | 20대 | image1.jpg | 1 | 4 | 3 | 5 | 4 | 5 | 3 |
| 2025-11-18... | user-456 | 여 | 20대 | image4.jpg | 4 | 2 | 3 | 2 | 3 | 4 | 5 |

### Statistics 시트 (자동 생성)

`createStatisticsSheet()` 함수 실행 후:

| 항목 | 평균 | 최소값 | 최대값 | 표준편차 |
|------|------|--------|--------|----------|
| 안전성 | 3.45 | 1 | 5 | 1.23 |
| 쾌적성 | 3.67 | 1 | 5 | 1.05 |

### Demographics 시트 (자동 생성)

`createDemographicsStatistics()` 함수 실행 후:

| 성별 | 연령대 | 응답 수 | 안전성 평균 | 쾌적성 평균 | ... |
|------|--------|--------|----------|----------|-----|
| 남 | 10대 | 6 | 3.50 | 3.67 | ... |
| 남 | 20대 | 6 | 3.33 | 3.50 | ... |
| 여 | 10대 | 6 | 3.67 | 3.83 | ... |

## 🎨 커스터마이징 가이드

### 평가 항목 추가

`script.js`의 `RATING_CATEGORIES`:
```javascript
const RATING_CATEGORIES = [
  { name: 'safety', label: '🛡️ 안전성', question: '이 장소는 안전하다고 느껴진다' },
  { name: 'comfort', label: '🌿 쾌적성', question: '이 장소는 쾌적하다고 느껴진다' },
  { name: 'convenience', label: '🚶 편리성', question: '이 장소는 보행하기 편리하다' },
  { name: 'accessibility', label: '♿ 접근성', question: '이 장소는 접근하기 쉽다' },
  { name: 'aesthetics', label: '🎨 심미성', question: '이 장소는 심미적으로 아름답다' },
  { name: 'activity', label: '🎪 활동성', question: '이 장소는 다양한 활동이 가능하다' },
  // 👇 새로운 항목 추가
  { name: 'nostalgia', label: '🕰️ 추억성', question: '이 장소는 추억을 불러일으킨다' }
];
```

`app_script.gs`의 `createResponsesSheet()` 함수에서 헤더 및 열 개수 수정 필요

### 색상 테마 변경

`style.css`의 그라디언트:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 이미지 개수 변경

`script.js`의 `IMAGES_PER_GROUP`:
```javascript
const IMAGES_PER_GROUP = 5;  // 한 명당 5개씩 평가
```

## 🔧 문제 해결

### ❌ "모든 이미지 평가가 완료되었습니다" 메시지

**원인**: 준비된 이미지보다 많은 참가자가 설문 완료

**해결**: 
- GitHub에 더 많은 이미지 추가
- 또는 `IMAGES_PER_GROUP` 값 감소

### ❌ 이미지가 로딩되지 않음

**원인**: GitHub 설정 오류

**확인사항**:
- 저장소가 **Public**인지 확인
- `GITHUB.owner`, `GITHUB.repo` 정확한지 확인
- 이미지가 `images/` 폴더에 있는지 확인
- 브라우저 콘솔(F12) 에러 확인

### ❌ 데이터가 Google Sheets에 저장되지 않음

**원인**: Apps Script 배포 오류

**확인사항**:
- Apps Script 배포 시 **액세스 권한**이 "모든 사용자"인지 확인
- `APPS_SCRIPT_URL` 정확한지 확인
- `SPREADSHEET_ID` 정확한지 확인
- Apps Script 실행 로그 확인 (Apps Script 편집기 > 실행 로그)

### ❌ CORS 에러 발생

**확인사항**:
- JSONP 방식을 사용하므로 CORS 문제 없음
- 브라우저 콘솔 에러 메시지 확인

## 📈 데이터 분석

### 통계 시트 생성

Apps Script 편집기에서 함수 실행:

```javascript
// 1. 기본 통계 생성
createStatisticsSheet()

// 2. 인구통계학적 분석
createDemographicsStatistics()
```

### 수동 분석

Google Sheets에서 QUERY 함수 사용:

```
=QUERY(Responses!A:L, "SELECT C, D, AVG(G), AVG(H) WHERE C IS NOT NULL GROUP BY C, D")
```

## 📝 로컬 스토리지 사용

각 브라우저에 저장되는 정보:

```javascript
// 마지막 사용자가 평가한 이미지의 인덱스
localStorage.getItem('lastImageIndex')

// 초기화 방법
localStorage.clear()
```

## 🚀 고급 설정

### 특정 이미지만 사용

`script.js`의 `getImageList()` 함수 수정:

```javascript
// 특정 접두사의 이미지만 필터링
const images = data.tree
  .filter(item => 
    item.type === "blob" && 
    item.path.startsWith(`${GITHUB.path}/`) && 
    exts.test(item.path) &&
    item.path.includes('special_')  // 'special_'로 시작하는 이미지만
  )
```

### 랜덤 순서로 표시

`getImageList()` 함수의 `return` 부분 수정:

```javascript
// 정렬 제거
return images;  // 원래 코드
return images.sort(() => Math.random() - 0.5);  // 랜덤 정렬
```

## 📧 지원

문제가 발생하면:

1. 브라우저 콘솔(F12) 에러 확인
2. Apps Script 실행 로그 확인
3. GitHub 저장소 설정 확인
4. Google Sheets 권한 확인

---

**제작**: 한양대학교 도시공학과 도시설계 및 공간분석 연구실
