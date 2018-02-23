const {
    app,
    ipcRenderer
} = require("electron");
const queryString = require('query-string');

const mode = queryString.parse(location.search).mode;

console.log(mode);

let page = 1;
let seasonNow;
let year;

if (mode === "season") {
    document.querySelector(".search__input").style.display = "none";
    document.getElementById("result").innerText = "本季新番";
    const now = new Date();
    const month = now.getMonth();
    year = now.getFullYear();
    if (month === 12 || month === 1 || month === 2) {
        seasonNow = "WINTER";
    } else if (month >= 3 && month <= 5) {
        seasonNow = "SPRING";
    } else if (month >= 6 && month <= 8) {
        seasonNow = "SUMMER";
    } else if (month >= 9 && month <= 11) {
        seasonNow = "FALL";
    }
    seasonFunction(year, seasonNow);

} else if (mode === "search") {
    document.querySelector(".search__input").addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            page = 1;
            searchFunction();
        }
    });
} else if (mode === "searchseason") {
    document.querySelector(".search__input").style.display = "none";
    let today = new Date(),
        yyyy = today.getFullYear(),
        inpYear = document.querySelector("#year"),
        html = '';

    for (var i = 50; i > 0; i--, yyyy--) {
        html += `<option value="${yyyy}">${yyyy}</option>`;
    };
    inpYear.innerHTML = html;
    const year_select = document.getElementById("year");
    const season_select = document.getElementById("season");
    year_select.style.display = "block";
    season_select.style.display = "block";
    seasonNow = season_select.value;
    year = year_select.value;
    seasonFunction(year, seasonNow);
    year_select.addEventListener("change", () => {
        page = 1;
        seasonNow = season_select.value;
        year = year_select.value;
        seasonFunction(year, seasonNow);
    });
    season_select.addEventListener("change", () => {
        page = 1;
        seasonNow = season_select.value;
        year = year_select.value;
        seasonFunction(year, seasonNow);
    });
}

const container = document.querySelector(".result__container");


async function seasonFunction(year, seasonNow) {
    const result = await season(page, year, seasonNow);
    console.log(result);
    pageDisplay(result);
}

async function searchFunction() {
    const keyword = document.querySelector(".search__input").value;
    const result = await search(keyword, page);
    document.getElementById("result").textContent = `" ${keyword} " 的搜尋結果`;
    pageDisplay(result);
}

function nextPage() {
    page++;
    document.querySelectorAll(".current__page").forEach(e => {
        e.textContent = page;
    })
    if (mode === "season" || mode === "searchseason") {
        seasonFunction(year, seasonNow);
    } else if (mode === "search") {
        searchFunction();
    }
};

function backPage() {
    page--;
    document.querySelectorAll(".current__page").forEach(e => {
        e.textContent = page;
    })
    if (mode === "season" || mode === "searchseason") {
        seasonFunction(year, seasonNow);
    } else if (mode === "search") {
        searchFunction();
    }
};


/* ANILIST SEARCH */



function search(keyword, page) {
    const searchQuery = `
query ($id: Int, $page: Int, $perPage: Int, $search: String) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, search: $search,sort: START_DATE_DESC) {
      id
      type
      startDate{
        year
        month
      }
      coverImage{
          large
      }
      title {
        native
        romaji
      }
    }
  }
}
`;
    const variables = {
        search: keyword,
        page: page,
        perPage: 50
    };

    const url = 'https://graphql.anilist.co';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: searchQuery,
            variables: variables
        })
    };
    return new Promise((resolve, reject) => {
        fetch(url, options).then((res) => {
            return res.json();
        }).then((res) => {
            resolve(res);
        });
    })

}

function season(page, year, seasonNow) {

    const seasonQuery = `
query ($id: Int, $page: Int, $perPage: Int, $season: MediaSeason,$seasonYear: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media (id: $id, season: $season,seasonYear: $seasonYear) {
      id
      type
      externalLinks{
          id
          url
          site
      }
      startDate{
        year
        month
      }
      coverImage{
          large
      }
      title {
        native
        romaji
      }
    }
  }
}
`;
    const variables = {
        season: seasonNow,
        seasonYear: year,
        page: page,
        perPage: 50
    };

    const url = 'https://graphql.anilist.co';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: seasonQuery,
            variables: variables
        })
    };
    return new Promise((resolve, reject) => {
        fetch(url, options).then((res) => {
            return res.json();
        }).then((res) => {
            resolve(res);
        });
    })

}

function pageDisplay(result) {
    container.innerHTML = `<div class="result__item" id="no-result">
    <h3 class="title-big">No Results</h3>
    </div>`;
    /* control page */
    document.querySelector(".current__page").textContent = page;
    if (result.data.Page.pageInfo.hasNextPage) {
        document.querySelectorAll(".page__next").forEach(e => {
            e.style.visibility = "visible";
            e.addEventListener("click", nextPage)
        })
    } else {
        document.querySelectorAll(".page__next").forEach(e => {
            e.style.visibility = "hidden";
            e.removeEventListener("click", nextPage);
        });
    };

    if (page !== 1) {
        document.querySelectorAll(".page__back").forEach(e => {
            e.style.visibility = "visible";
            e.addEventListener("click", backPage)
        })
    } else {
        document.querySelectorAll(".page__back").forEach(e => {
            e.style.visibility = "hidden";
            e.removeEventListener("click", backPage);
        });
    }

    /* display all result */
    const filteredResult = result.data.Page.media.filter((e) => {
        return e.type === "ANIME" || e.type === "TV"
    });
    if (filteredResult.length > 0) {
        document.getElementById("no-result").style.display = "none";
    } else {
        return;
    }
    filteredResult.forEach(e => {
        container.innerHTML += `<div class="result__item">
        <div class="result__title">
        <h3 class="title-big">${e.title.native}</h3>
        <h3 class=${e.title.native? "title-med":"title-big"}>${e.title.romaji}</h3>
        <h3 class="title-date">${e.startDate.year||""}${(e.startDate.year)? "/":""}${e.startDate.month||""}</h3>
        </div>
        <div class="result__footer">
        <p class="result__item-id">${e.id}</p>
        <button class="result__item-btn" data-links='${JSON.stringify(e.externalLinks)}' data-year="${e.startDate.year}" data-month="${e.startDate.month}" data-id="${e.id}" data-title_native="${e.title.native}" data-title_roma="${e.title.romaji}" data-cover="${e.coverImage.large}"><i class="fas fa-plus"></i></button>
        </div>
        </div>`;
        document.querySelector(".result__item:last-child").style.backgroundImage = `linear-gradient(to right bottom,rgba(0, 0, 0,.5),rgba(0, 0, 0,.5)),url(${e.coverImage.large})`;
    });
    document.querySelectorAll(".result__item-btn").forEach(e => e.addEventListener("click", (e) => {
        const data = e.target.dataset;
        const links = JSON.parse(data.links);
        data.op = false;
        data.ed = false;
        data.current = 0;
        data.week = 0;
        data.title_custom = undefined;
        data.link1 = undefined;
        data.link2 = undefined;
        links.forEach(e => {
            if (e.site === "Official Site") {
                data.link1 = JSON.stringify({
                    name: "官網",
                    url: e.url
                });
            } else if (e.site === "Twitter") {
                data.link2 = JSON.stringify({
                    name: "推特",
                    url: e.url
                });
            }
        });
        ipcRenderer.send("new-anime", data);
        e.target.innerHTML = `<i class="fas fa-check"></i>`;
        e.target.disabled = true;
    }));
}