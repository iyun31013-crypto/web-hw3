// app.js : 영화 배열을 다루는 함수 6개 / 이윤(26학번)


const liked = JSON.parse(localStorage.getItem("liked") || "[]");

function saveLiked() {
    localStorage.setItem("liked", JSON.stringify(liked));
}

function updateLikeCount() {
    document.getElementById("likeCount").textContent = liked.length;
}



// 영화 배열을 다루는 기본 함수
// 1
function average(list) {
    let sum = 0;
    for (const m of list) {
        sum += m.rating;
    }
    return sum / list.length;
}
console.log("평균:", average(movies));



// 2
function best(list) {
    let top = list[0];
    for (const m of list) {
        if (m.rating > top.rating) {
            top = m;
        }
    }
    return top;
}
console.log("최고:", best(movies).title);



// 3
function filterByRating(list, min) {
    return list.filter(m => m.rating >= min);
}
console.log("8점 이상:", filterByRating(movies, 8).length + "편");


// 5
function yearsSince(dateStr) {
    return new Date().getFullYear() - new Date(dateStr).getFullYear();
}
console.log(yearsSince(movies[0].date) + "년 전 개봉");



function posterUrl(path, size) {
    return "https://image.tmdb.org/t/p/" + size + path;
}
console.log(posterUrl(movies[0].poster, "w342"));

async function searchTMDB(keyword) {
    const url = "https://api.themoviedb.org/3/search/movie?api_key=" + KEYS.TMDB_KEY +
 "&language=ko-KR&query=" + encodeURIComponent(keyword);

    const res = await fetch(url);
    const data = await res.json();

    return data.results.slice(0, 5);
};


// search : 검색어가 포함된 영화 찾기
function search(list, keyword) {
    return list.filter(m =>
        m.title.toLowerCase().includes(keyword.toLowerCase())
    );
}


// 4
function sortBy(list, key, desc) {
    const copy = [...list];

    copy.sort((a, b) => {
        if (typeof a[key] === "string") {
            return a[key].localeCompare(b[key]);
        }

        return a[key] - b[key];
    });

    if (desc) {
        copy.reverse();
    }

    return copy;
}


// renderCards : 영화 배열 ⇒ 보드에 카드 생성
function renderCards(list) {
    const board = document.querySelector(".board");
    board.innerHTML = "";

    for (const m of list) {
        const card = document.createElement("article");
        card.className = "card";

        // 평점이 8점 이상이면 hot 클래스 추가
        if (m.rating >= 8) {
            card.classList.add("hot");
        }

        // 카드에 데이터 속성 추가
        card.setAttribute("data-type", m.type);
        card.setAttribute("data-title", m.title);

        // 박스오피스 영화에만 순위 표시
        let rankHTML = "";

        if (m.type === "boxoffice" && m.rank != null) {
            rankHTML = `<span class="rank">${m.rank}</span>`;
        }

        // 포스터가 없으면 영화 제목 표시
        let posterHTML = "";

        if (m.poster) {
            posterHTML = `
                <img class="poster"
                src="${posterUrl(m.poster, "w342")}"
                alt="${m.title} 포스터">
            `;
        } else {
            card.classList.add("no-poster");

            posterHTML = `
                <div class="poster-fallback">${m.title}</div>
            `;
        }

        // 이미 찜한 영화인지 확인
        const isLiked = liked.includes(m.title);

        // 카드 내용 생성
        card.innerHTML = `
            ${rankHTML}
            ${posterHTML}

            <span class="badge">${m.rating}</span>

            <div class="info">
                <h3>${m.title}</h3>
                <p class="year">${m.year}</p>

                <button class="like ${isLiked ? "liked" : ""}"
                type="button">♥</button>
            </div>
        `;

        board.appendChild(card);
    }

    // 영화가 없을 때 안내 문구 표시
    if (list.length === 0) {
        board.classList.add("is-empty");
    } else {
        board.classList.remove("is-empty");
    }

    const emptyMessage = document.querySelector(".state-empty");

    if (emptyMessage) {
        emptyMessage.hidden = list.length !== 0;
    }

    // 영화 개수 표시
    document.querySelector("#count").textContent =
        list.length + "편";

    updateLikeCount();

}


// 6. 검색 + 보기 필터 + 정렬
function getView() {

    const keyword = document.querySelector("#q").value.trim();

    const key = document.querySelector("#sort").value;

    const checkedType = document.querySelector(
        'input[name="type"]:checked'
    );

    const type = checkedType ? checkedType.value : "all";

    let result = search(movies, keyword);

    if (type !== "all") {
        result = result.filter(m => m.type === type);
    }

    result = sortBy(result, key, key !== "title");

    return result;
}


// 7. 화면 새로고침 함수
function refresh() {
    renderCards(getView());
}


function openDetail(title) {

    const m = movies.find(m => m.title === title);

    if (!m) return;


    const dialog = document.getElementById("detail");
    const detailBody = document.getElementById("detailBody");


    detailBody.innerHTML = `

        <img
            src="${m.poster ? posterUrl(m.poster, "w500") : ""}"
            alt="${m.title} 포스터"
            class="detail-poster">

        <h2>${m.title}</h2>

        <p>개봉일: ${m.date}</p>

        <p>평점: ${m.rating}</p>

        <h3>줄거리</h3>

        <p>${m.overview || "등록된 줄거리가 없습니다."}</p>

    `;


    dialog.showModal();
}


// 8. 이벤트 리스너
document.querySelector("#q").addEventListener("input", refresh);

//TMDB 실시간 검색

document.querySelector("#q").addEventListener("keydown", async (e) => {
    if(e.key !== "Enter") return;

    const keyword = e.target.value.trim();

    if(!keyword){
        refresh();
        return;
    }
    try{
        const results = await searchTMDB(keyword);

        const tmdbmovies = results.map(r => ({
            title: r.title,
            year: r.release_date ? Number(r.release_date.slice(0, 4)) : "",
            date: r.release_date, 
            rating: Math.round(r.vote_average * 10) / 10,
            poster: r.poster_path, 
            overview: r.overview, 
            type: "tmdb", rank: null
        }));

        renderCards(tmdbmovies);
    }
    catch(error){
        console.error("TMDB 검색 중 오류",error);
        alert("영화 검색에 실패했습니다. API키와 인터넷 연결을 확인하세요.");
    }
});

document.querySelector("#sort").addEventListener("change", refresh);

document.querySelector("#typeFilter").addEventListener("change", refresh);


document.querySelector(".board").addEventListener("click", (e) => {

    const card = e.target.closest(".card");

    if (!card) return;

    const title = card.getAttribute("data-title");


    // 좋아요 버튼을 누른 경우
    if (e.target.closest(".like")) {

        const i = liked.indexOf(title);

        if (i === -1) {
            liked.push(title);
        }

        else {
            liked.splice(i, 1);
        }

        saveLiked();

        refresh();

        return;
    }


    openDetail(title);
});


const dialog = document.getElementById("detail");

document.getElementById("open").addEventListener("click", () => {
    dialog.showModal();
});

document.getElementById("closeDetail").addEventListener("click", () => {
    dialog.close();
});

// 9. 처음 화면 실행
refresh()
