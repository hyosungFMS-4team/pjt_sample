// 마커를 담을 배열입니다
let markers = [];

let mapContainer = document.getElementById('map'), // 지도를 표시할 div
  mapOption = {
    center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
    level: 3, // 지도의 확대 레벨
  };

// 지도를 생성합니다
let map = new kakao.maps.Map(mapContainer, mapOption);

// 장소 검색 객체를 생성합니다
let ps = new kakao.maps.services.Places();

// 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우를 생성합니다
let infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

// 키워드로 장소를 검색합니다
searchPlaces();

// 키워드 검색을 요청하는 함수입니다
function searchPlaces() {
  let keyword = document.getElementById('keyword').value;

  if (!keyword.replace(/^\s+|\s+$/g, '')) {
    alert('키워드를 입력해주세요!');
    return false;
  }

  // 장소검색 객체를 통해 키워드로 장소검색을 요청합니다
  ps.keywordSearch(keyword, placesSearchCB);
}

// 장소검색이 완료됐을 때 호출되는 콜백함수 입니다
function placesSearchCB(data, status, pagination) {
  if (status === kakao.maps.services.Status.OK) {
    // 정상적으로 검색이 완료됐으면
    // 검색 목록과 마커를 표출합니다
    displayPlaces(data);

    // 페이지 번호를 표출합니다
    displayPagination(pagination);
  } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
    alert('검색 결과가 존재하지 않습니다.');
    return;
  } else if (status === kakao.maps.services.Status.ERROR) {
    alert('검색 결과 중 오류가 발생했습니다.');
    return;
  }
}

// 검색 결과 목록과 마커를 표출하는 함수입니다
function displayPlaces(places) {
  let listEl = document.getElementById('placesList'),
    menuEl = document.getElementById('menu_wrap'),
    fragment = document.createDocumentFragment(),
    bounds = new kakao.maps.LatLngBounds(),
    listStr = '';

  // 검색 결과 목록에 추가된 항목들을 제거합니다
  removeAllChildNods(listEl);

  // 지도에 표시되고 있는 마커를 제거합니다
  removeMarker();

  for (let i = 0; i < places.length; i++) {
    // 마커를 생성하고 지도에 표시합니다
    let placePosition = new kakao.maps.LatLng(places[i].y, places[i].x),
      marker = addMarker(placePosition, i),
      itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
    // LatLngBounds 객체에 좌표를 추가합니다
    bounds.extend(placePosition);

    // 마커와 검색결과 항목에 mouseover 했을때
    // 해당 장소에 인포윈도우에 장소명을 표시합니다
    // mouseout 했을 때는 인포윈도우를 닫습니다
    (function (marker, title) {
      kakao.maps.event.addListener(marker, 'mouseover', function () {
        displayInfowindow(marker, title);
      });

      kakao.maps.event.addListener(marker, 'mouseout', function () {
        infowindow.close();
      });

      itemEl.onmouseover = function () {
        displayInfowindow(marker, title);
      };

      itemEl.onmouseout = function () {
        infowindow.close();
      };
    })(marker, places[i].place_name);

    fragment.appendChild(itemEl);
  }

  // 검색결과 항목들을 검색결과 목록 Element에 추가합니다
  listEl.appendChild(fragment);
  menuEl.scrollTop = 0;

  // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
  map.setBounds(bounds);
}

// 검색결과 항목을 Element로 반환하는 함수입니다
function getListItem(index, places) {
  let el = document.createElement('li'),
    itemStr = '<span class="markerbg marker_' + (index + 1) + '"></span>' + '<div class="info">' + '   <h5>' + places.place_name + '</h5>';

  if (places.road_address_name) {
    itemStr += '    <span>' + places.road_address_name + '</span>' + '   <span class="jibun gray">' + places.address_name + '</span>';
  } else {
    itemStr += '    <span>' + places.address_name + '</span>';
  }

  itemStr += '  <span class="tel">' + places.phone + '</span>' + '</div>';

  el.innerHTML = itemStr;
  el.className = 'item';

  // TODO:
  el.addEventListener('click', () => {
    addTravelPlanItem(places);
  });

  return el;
}

function createTravelplanItem(places) {
  console.log(places);
  fetchHTML(places.place_name).then(res => {
    console.log(res);
    extractInfoFromHTML(res);
  });
}

async function fetchHTML(place_name) {
  try {
    const url = `https://www.google.com/search?q=${place_name}`;

    const response = await fetch(url);
    console.log(response);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching HTML:', error);
    return null;
  }
}

// HTML에서 원하는 정보를 추출하는 함수
function extractInfoFromHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  console.log(doc);
  const imgElement = doc.getElementById('dimg_61');
  console.log(imgElement);

  // const imageElement = doc.querySelector('.bg_present');
  // doc.querySelector();
  // console.log(imageElement);
  // const title = titleElement ? titleElement.textContent.trim() : 'Title not found';

  // return title;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, idx, title) {
  let imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
    imageSize = new kakao.maps.Size(36, 37), // 마커 이미지의 크기
    imgOptions = {
      spriteSize: new kakao.maps.Size(36, 691), // 스프라이트 이미지의 크기
      spriteOrigin: new kakao.maps.Point(0, idx * 46 + 10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
      offset: new kakao.maps.Point(13, 37), // 마커 좌표에 일치시킬 이미지 내에서의 좌표
    },
    markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imgOptions),
    marker = new kakao.maps.Marker({
      position: position, // 마커의 위치
      image: markerImage,
    });

  marker.setMap(map); // 지도 위에 마커를 표출합니다
  markers.push(marker); // 배열에 생성된 마커를 추가합니다

  return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
function removeMarker() {
  for (let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}

// 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
function displayPagination(pagination) {
  let paginationEl = document.getElementById('pagination'),
    fragment = document.createDocumentFragment(),
    i;

  // 기존에 추가된 페이지번호를 삭제합니다
  while (paginationEl.hasChildNodes()) {
    paginationEl.removeChild(paginationEl.lastChild);
  }

  for (i = 1; i <= pagination.last; i++) {
    let el = document.createElement('a');
    el.href = '#';
    el.innerHTML = i;

    if (i === pagination.current) {
      el.className = 'on';
    } else {
      el.onclick = (function (i) {
        return function () {
          pagination.gotoPage(i);
        };
      })(i);
    }

    fragment.appendChild(el);
  }
  paginationEl.appendChild(fragment);
}

// 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
// 인포윈도우에 장소명을 표시합니다
function displayInfowindow(marker, title) {
  let content = '<div style="padding:5px;z-index:1;">' + title + '</div>';

  infowindow.setContent(content);
  infowindow.open(map, marker);
}

// 검색결과 목록의 자식 Element를 제거하는 함수입니다
function removeAllChildNods(el) {
  while (el.hasChildNodes()) {
    el.removeChild(el.lastChild);
  }
}

// ===============================================================
//                         ITEM ADD
// ===============================================================

document.addEventListener('DOMContentLoaded', () => {
  // FIXME: 백엔드 연결하면 여기서 최초 데이터 받아오기
  renderTasks();
});

const travelPlanList = document.querySelector('.main_canvan');
let travelPlanItems = [];

function renderTasks() {
  // let existingIds = new Set();

  while (travelPlanList.firstChild) {
    travelPlanList.removeChild(travelPlanList.firstChild);
  }

  travelPlanItems.forEach((item, idx) => {
    const taskElement = isNindxItem(item, idx);
    // TODO: 이동 시간 태그 추가

    console.log(taskElement);
    travelPlanList.appendChild(taskElement);
  });
}

function addTravelPlanItem(places) {
  let currentDate = new Date();
  let milliseconds = currentDate.getMilliseconds();
  let formattedDate = `${currentDate.getFullYear()}${('0' + (currentDate.getMonth() + 1)).slice(-2)}${('0' + currentDate.getDate()).slice(-2)}_${(
    '0' + currentDate.getHours()
  ).slice(-2)}${('0' + currentDate.getMinutes()).slice(-2)}${('0' + currentDate.getSeconds()).slice(-2)}_${milliseconds}`;

  const newTravelPlanItem = {
    id: `${formattedDate}_clinetname`, // FIXME: 실제 클라이언트 이름으로 교체
    road_address_name: places.road_address_name,
    category_group_name: places.category_group_name,
    place_name: places.place_name,
    lat: places.x,
    lng: places.y,
    img_path: places.place_url,
  };

  travelPlanItems.push(newTravelPlanItem);

  // console.log(newTravelPlanItem);
  // console.log(travelPlanItems);
  renderTasks();
}

function isNindxItem(item, idx) {
  let tagItem;
  if (idx == 0) tagItem = createFirstItem(item.road_address_name, item.category_group_name, item.place_name, item.x, item.y);
  else if (idx == travelPlanItems.length - 1)
    tagItem = createLastItem(item.road_address_name, item.category_group_name, item.place_name, item.x, item.y, idx + 1);
  else tagItem = createMiddleItem(item.road_address_name, item.category_group_name, item.place_name, item.x, item.y, idx + 1);

  return tagItem;
}

function createFirstItem(road_address_name, category_group_name, place_name, x, y) {
  var liElement = document.createElement('li');
  liElement.classList.add('plan_item');

  // 왼쪽 부분 생성
  var leftDiv = document.createElement('div');
  leftDiv.classList.add('plan_item_left');

  // 왼쪽 인덱스 생성
  var leftIndexDiv = document.createElement('div');
  leftIndexDiv.classList.add('plan_item_left_index');

  var indexCircleDiv = document.createElement('div');
  indexCircleDiv.classList.add('plan_item_left_index_circle');
  indexCircleDiv.textContent = 1;

  leftIndexDiv.appendChild(indexCircleDiv);

  // 왼쪽 선 생성
  var leftLineDiv = document.createElement('div');
  leftLineDiv.classList.add('plan_item_left_line');

  var leftLineRealDiv = document.createElement('div');
  leftLineRealDiv.classList.add('plan_item_left_line_real');

  leftLineDiv.appendChild(leftLineRealDiv);

  leftDiv.appendChild(leftIndexDiv);
  leftDiv.appendChild(leftLineDiv);

  // 오른쪽 부분 생성
  var rightDiv = document.createElement('div');
  rightDiv.classList.add('plan_item_right');

  var rightWrapperDiv = document.createElement('div');
  rightWrapperDiv.classList.add('right_wrapper');

  var rightTopDiv = document.createElement('div');
  rightTopDiv.classList.add('plan_item_right_top');

  var rightTopTimeDiv = document.createElement('div');
  rightTopTimeDiv.classList.add('plan_item_right_top_time');
  rightTopTimeDiv.textContent = '14:00 - 16:00'; // FIXME: 시간 데이터 나중에 변경

  rightTopDiv.appendChild(rightTopTimeDiv);

  var rightBottomDiv = document.createElement('div');
  rightBottomDiv.classList.add('plan_item_right_bottom');

  var rightBottomDescDiv = document.createElement('div');
  rightBottomDescDiv.classList.add('plan_item_right_bottom_desc');

  var categoryDiv = document.createElement('div');
  categoryDiv.classList.add('plan_item_right_bottom_desc_category');
  categoryDiv.textContent = category_group_name;

  var nameDiv = document.createElement('div');
  nameDiv.classList.add('plan_item_right_bottom_desc_name');
  nameDiv.textContent = place_name;

  var memoDiv = document.createElement('div');
  memoDiv.classList.add('plan_item_right_bottom_desc_memo');
  memoDiv.textContent = '메모를 입력하세요.';

  rightBottomDescDiv.appendChild(categoryDiv);
  rightBottomDescDiv.appendChild(nameDiv);
  rightBottomDescDiv.appendChild(memoDiv);

  var rightDividerDiv = document.createElement('div');
  rightDividerDiv.classList.add('right_divider');

  var imgAreaDiv = document.createElement('div');
  imgAreaDiv.classList.add('plan_item_right_bottom_img_area');

  var imgElement = document.createElement('img');
  imgElement.classList.add('plan_item_right_bottom_img');
  imgElement.src = 'image/dummy.png';
  imgElement.alt = '';

  imgAreaDiv.appendChild(imgElement);

  rightBottomDiv.appendChild(rightBottomDescDiv);
  rightBottomDiv.appendChild(rightDividerDiv);
  rightBottomDiv.appendChild(imgAreaDiv);

  rightWrapperDiv.appendChild(rightTopDiv);
  rightWrapperDiv.appendChild(rightBottomDiv);

  rightDiv.appendChild(rightWrapperDiv);

  liElement.appendChild(leftDiv);
  liElement.appendChild(rightDiv);

  return liElement;
}

function createMiddleItem(road_address_name, category_group_name, place_name, x, y, idx) {
  // li 요소 생성
  var liElement = document.createElement('li');
  liElement.classList.add('plan_item');

  // 왼쪽 부분 생성
  var leftDiv = document.createElement('div');
  leftDiv.classList.add('plan_item_left');

  // 첫 번째 선 생성
  var midPlanItemLeftLineOneDiv = document.createElement('div');
  midPlanItemLeftLineOneDiv.classList.add('mid_plan_item_left_line_one');

  var leftLineOneDiv = document.createElement('div');
  leftLineOneDiv.classList.add('plan_item_left_line_real');

  midPlanItemLeftLineOneDiv.appendChild(leftLineOneDiv);

  // 왼쪽 인덱스 생성
  var midPlanItemLeftIndexDiv = document.createElement('div');
  midPlanItemLeftIndexDiv.classList.add('mid_plan_item_left_index');

  var midPlanItemLeftIndexCircleDiv = document.createElement('div');
  midPlanItemLeftIndexCircleDiv.classList.add('mid_plan_item_left_index_circle');
  midPlanItemLeftIndexCircleDiv.textContent = idx;

  var planItemLeftIndexLineDiv = document.createElement('div');
  planItemLeftIndexLineDiv.classList.add('plan_item_left_index_line');

  midPlanItemLeftIndexDiv.appendChild(midPlanItemLeftIndexCircleDiv);
  midPlanItemLeftIndexDiv.appendChild(planItemLeftIndexLineDiv);

  // 두 번째 선 생성
  var midPlanItemLeftLineTwoDiv = document.createElement('div');
  midPlanItemLeftLineTwoDiv.classList.add('mid_plan_item_left_line_two');

  var leftLineTwoDiv = document.createElement('div');
  leftLineTwoDiv.classList.add('plan_item_left_line_real');

  midPlanItemLeftLineTwoDiv.appendChild(leftLineTwoDiv);

  leftDiv.appendChild(midPlanItemLeftLineOneDiv);
  leftDiv.appendChild(midPlanItemLeftIndexDiv);
  leftDiv.appendChild(midPlanItemLeftLineTwoDiv);

  // 오른쪽 부분 생성
  var rightDiv = document.createElement('div');
  rightDiv.classList.add('plan_item_right');

  var rightWrapperDiv = document.createElement('div');
  rightWrapperDiv.classList.add('right_wrapper');

  var rightTopDiv = document.createElement('div');
  rightTopDiv.classList.add('plan_item_right_top');

  var rightTopTimeDiv = document.createElement('div');
  rightTopTimeDiv.classList.add('plan_item_right_top_time');
  rightTopTimeDiv.textContent = '16:00 - 18:00'; // FIXME: 시간 바꾸기

  rightTopDiv.appendChild(rightTopTimeDiv);

  var rightBottomDiv = document.createElement('div');
  rightBottomDiv.classList.add('plan_item_right_bottom');

  var rightBottomDescDiv = document.createElement('div');
  rightBottomDescDiv.classList.add('plan_item_right_bottom_desc');

  var categoryDiv = document.createElement('div');
  categoryDiv.classList.add('plan_item_right_bottom_desc_category');
  categoryDiv.textContent = category_group_name;

  var nameDiv = document.createElement('div');
  nameDiv.classList.add('plan_item_right_bottom_desc_name');
  nameDiv.textContent = place_name;

  var memoDiv = document.createElement('div');
  memoDiv.classList.add('plan_item_right_bottom_desc_memo');
  memoDiv.textContent = '메모를 입력하세요.';

  rightBottomDescDiv.appendChild(categoryDiv);
  rightBottomDescDiv.appendChild(nameDiv);
  rightBottomDescDiv.appendChild(memoDiv);

  var rightDividerDiv = document.createElement('div');
  rightDividerDiv.classList.add('right_divider');

  var imgAreaDiv = document.createElement('div');
  imgAreaDiv.classList.add('plan_item_right_bottom_img_area');

  var imgElement = document.createElement('img');
  imgElement.classList.add('plan_item_right_bottom_img');
  imgElement.src = 'image/dummy.png';
  imgElement.alt = '';

  imgAreaDiv.appendChild(imgElement);

  rightBottomDiv.appendChild(rightBottomDescDiv);
  rightBottomDiv.appendChild(rightDividerDiv);
  rightBottomDiv.appendChild(imgAreaDiv);

  rightWrapperDiv.appendChild(rightTopDiv);
  rightWrapperDiv.appendChild(rightBottomDiv);

  rightDiv.appendChild(rightWrapperDiv);

  liElement.appendChild(leftDiv);
  liElement.appendChild(rightDiv);

  return liElement;
}

function createLastItem(road_address_name, category_group_name, place_name, x, y, idx) {
  // li 요소 생성
  var liElement = document.createElement('li');
  liElement.classList.add('plan_item');

  // 왼쪽 부분 생성
  var leftDiv = document.createElement('div');
  leftDiv.classList.add('plan_item_left');

  // 첫 번째 선 생성
  var lastPlanItemLeftLineOneDiv = document.createElement('div');
  lastPlanItemLeftLineOneDiv.classList.add('last_plan_item_left_line_one');

  var leftLineOneDiv = document.createElement('div');
  leftLineOneDiv.classList.add('plan_item_left_line_real');

  lastPlanItemLeftLineOneDiv.appendChild(leftLineOneDiv);

  // 왼쪽 인덱스 생성
  var lastPlanItemLeftIndexDiv = document.createElement('div');
  lastPlanItemLeftIndexDiv.classList.add('last_plan_item_left_index');

  var midPlanItemLeftIndexCircleDiv = document.createElement('div');
  midPlanItemLeftIndexCircleDiv.classList.add('mid_plan_item_left_index_circle');
  midPlanItemLeftIndexCircleDiv.textContent = idx;

  var planItemLeftIndexLineDiv = document.createElement('div');
  planItemLeftIndexLineDiv.classList.add('plan_item_left_index_line');

  lastPlanItemLeftIndexDiv.appendChild(midPlanItemLeftIndexCircleDiv);
  lastPlanItemLeftIndexDiv.appendChild(planItemLeftIndexLineDiv);

  // 두 번째 선 생성
  var lastPlanItemLeftLineTwoDiv = document.createElement('div');
  lastPlanItemLeftLineTwoDiv.classList.add('last_plan_item_left_line_two');

  var leftLineTwoDiv = document.createElement('div');
  leftLineTwoDiv.classList.add('last_plan_item_left_line_real');

  var leftLineTwoCircleDiv = document.createElement('div');
  leftLineTwoCircleDiv.classList.add('last_plan_item_left_line_real_circle');

  lastPlanItemLeftLineTwoDiv.appendChild(leftLineTwoDiv);
  lastPlanItemLeftLineTwoDiv.appendChild(leftLineTwoCircleDiv);

  leftDiv.appendChild(lastPlanItemLeftLineOneDiv);
  leftDiv.appendChild(lastPlanItemLeftIndexDiv);
  leftDiv.appendChild(lastPlanItemLeftLineTwoDiv);

  // 오른쪽 부분 생성
  var rightDiv = document.createElement('div');
  rightDiv.classList.add('plan_item_right');

  var rightWrapperDiv = document.createElement('div');
  rightWrapperDiv.classList.add('right_wrapper');

  var rightTopDiv = document.createElement('div');
  rightTopDiv.classList.add('plan_item_right_top');

  var rightTopTimeDiv = document.createElement('div');
  rightTopTimeDiv.classList.add('plan_item_right_top_time');
  rightTopTimeDiv.textContent = '19:00 - 20:00';

  rightTopDiv.appendChild(rightTopTimeDiv);

  var rightBottomDiv = document.createElement('div');
  rightBottomDiv.classList.add('plan_item_right_bottom');

  var rightBottomDescDiv = document.createElement('div');
  rightBottomDescDiv.classList.add('plan_item_right_bottom_desc');

  var categoryDiv = document.createElement('div');
  categoryDiv.classList.add('plan_item_right_bottom_desc_category');
  categoryDiv.textContent = category_group_name;

  var nameDiv = document.createElement('div');
  nameDiv.classList.add('plan_item_right_bottom_desc_name');
  nameDiv.textContent = place_name;

  var memoDiv = document.createElement('div');
  memoDiv.classList.add('plan_item_right_bottom_desc_memo');
  memoDiv.textContent = '메모를 입력하세요.';

  rightBottomDescDiv.appendChild(categoryDiv);
  rightBottomDescDiv.appendChild(nameDiv);
  rightBottomDescDiv.appendChild(memoDiv);

  var rightDividerDiv = document.createElement('div');
  rightDividerDiv.classList.add('right_divider');

  var imgAreaDiv = document.createElement('div');
  imgAreaDiv.classList.add('plan_item_right_bottom_img_area');

  var imgElement = document.createElement('img');
  imgElement.classList.add('plan_item_right_bottom_img');
  imgElement.src = 'image/dummy.png';
  imgElement.alt = '';

  imgAreaDiv.appendChild(imgElement);

  rightBottomDiv.appendChild(rightBottomDescDiv);
  rightBottomDiv.appendChild(rightDividerDiv);
  rightBottomDiv.appendChild(imgAreaDiv);

  rightWrapperDiv.appendChild(rightTopDiv);
  rightWrapperDiv.appendChild(rightBottomDiv);

  rightDiv.appendChild(rightWrapperDiv);

  liElement.appendChild(leftDiv);
  liElement.appendChild(rightDiv);

  return liElement;
}

function createMoveTimeElement(time) {
  let liElement = document.createElement('li');
  liElement.classList.add('move_time');

  let imgElement = document.createElement('img');
  imgElement.classList.add('move_time_car');
  imgElement.src = 'image/car.png';
  imgElement.alt = '';

  let timeElement = document.createElement('div');
  timeElement.classList.add('move_time_time');
  timeElement.textContent = time + '분';

  let toElement = document.createElement('div');
  toElement.classList.add('move_time_to');
  toElement.textContent = '경로 보기';

  liElement.appendChild(imgElement);
  liElement.appendChild(timeElement);
  liElement.appendChild(toElement);

  return liElement;
}

// =======================================================

// renderTask();
