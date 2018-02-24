const {
    ipcRenderer,
    shell
} = require("electron");
const {
    dialog
} = require('electron').remote;

if (localStorage.getItem("page") === null) {
    localStorage.setItem("page", "init");
}

let display_page = localStorage.getItem("page");

document.getElementById("nav__add-search").addEventListener("click", () => {
    window.open(`file://${__dirname}/searchWindow.html?mode=search`, "搜尋作品", "width=730,height=900");
});
document.getElementById("nav__season").addEventListener("click", () => {
    window.open(`file://${__dirname}/searchWindow.html?mode=season`, "本季新番", "width=730,height=900");
});
document.getElementById("nav__search-season").addEventListener("click", () => {
    window.open(`file://${__dirname}/searchWindow.html?mode=searchseason`, "季度搜尋", "width=730,height=900");
});

document.querySelectorAll(".date__list-item").forEach(e => e.addEventListener("click", (e) => {
    if (document.querySelector(".date__selected") === e.target) {
        return;
    }
    localStorage.setItem("page", e.target.dataset.day);
    document.querySelector(".date__selected").classList.remove("date__selected");
    e.target.classList.add("date__selected");
    ipcRenderer.send("read-file", e.target.dataset.day);
}));


if (display_page === "init") {
    // 啟動顯示當日
    const now = new Date();
    display_page = now.getDay();
}

document.querySelector(`[data-day="${display_page}"]`).classList.add("date__selected");
localStorage.setItem("page", display_page);
ipcRenderer.send("read-file", display_page);

ipcRenderer.on("quit-app", (e) => {
    // quit時呼叫
    localStorage.setItem("page", "init");
});



// form
let type;
let id;


ipcRenderer.on("show-content", (e, data, all) => {
    const items = data;
    // update page
    document.getElementById("sum-this").textContent = Object.keys(items).length;
    document.getElementById("sum-all").textContent = all;
    if (data === 0 || Object.keys(data).length === 0) {
        document.querySelector(".list").innerHTML = "";
        document.querySelector(".no-items").style.display = "block";
        return;
    }
    document.querySelector(".no-items").style.display = "none";


    const weeklist = {
        1: "一",
        2: "二",
        3: "三",
        4: "四",
        5: "五",
        6: "六",
        7: "日",
        0: ""
    };
    document.querySelector(".list").innerHTML = "";
    Object.entries(items).forEach(([key, value]) => {
        document.querySelector(".list").innerHTML += `<div class="list__item">
        <p class="list__item--week">${weeklist[value.week]}</p>
        <button class="list__item--delete" data-id="${value.id}"><i class="fas fa-trash-alt fa-lg"></i></button>
        <div class="list__item--title-box">
        <h1 class="list__item--custom">${value.title_custom !== "undefined" ? value.title_custom : ""}</h1>
        <h2 class="list__item--native">${value.title_native}</h2>
        <h2 class="${value.title_native ? "list__item--roma":"list__item--native"}">${value.title_roma}</h2>
        </div>
        <div class="list__item--content">
           <img src="${value.cover}" alt="cover" class="cover">
           <div class="list__item--detail">
           <div class="number">
               <p class="release"><span class="year">${value.year}</span><span class="month">${value.month}月</span></p>
               <div class="current">
               <button class="current__btn check" data-id="${value.id}"><i class="fas fa-plus fa-sm"></i></button>
               <span class="current__num" data-id="${value.id}">${value.current}</span>
                <button class="current__btn cross" data-id="${value.id}"><i class="fas fa-minus fa-sm"></i></button>
               </div>
            </div>
               <div class="links">
                   <button class="btn link" data-url="${value.link1 !== "undefined" ? JSON.parse(value.link1).url : "#"}">${value.link1 !== "undefined" ? JSON.parse(value.link1).name : "未定義"}</button>
                   <button class="btn link" data-url="${value.link2 !== "undefined" ? JSON.parse(value.link2).url : "#"}">${value.link2 !== "undefined" ? JSON.parse(value.link2).name : "未定義"}</button>
               </div>
           </div>
       </div> 
       <div class="list__item--setting">
       <button class="btn-setting custom-title" data-id="${key}" data-req="custom-title">自訂標題</button>
       <button class="btn-setting custom-links" data-id="${key}" data-req="custom-links">定義連結</button>
       <button class="btn-setting set-week" data-id="${key}" data-req="set-week">星期設定</button>
       </div>
    </div>`

    });
    // settings
    const form = {
        "custom-title": {
            form: document.querySelector("#custom_title-form"),
            input: document.querySelector("#custom_title-input"),
            btn: document.querySelector("#custom_title-btn")
        },
        "custom-links": {
            form: document.querySelector("#custom_link-form"),
            name1: document.querySelector("#custom_link-input-name-1"),
            name2: document.querySelector("#custom_link-input-name-2"),
            url: document.querySelector("#custom_link-input-url-1"),
            input: document.querySelector("#custom_link-input-url-2"),
            btn: document.querySelector("#custom_link-btn")
        },
        "set-week": {
            form: document.querySelector("#week-form"),
            input: document.querySelector("#week-select"),
            btn: document.querySelector("#week-btn")
        }
    }
    // 隱藏form
    Object.entries(form).forEach(([key, value]) => {
        value.form.addEventListener("click", (e)=>{
            if(e.target === form[type].form){
                form[type].form.style.display = "none";
            }
        });
    });
    // 設定title(enter)
    form["custom-title"].input.addEventListener("keypress", (e) => {
        if (e.keyCode === 13) {
            submit(type, id, form[type].input.value);
        }
    });
    // 設定title按鈕
    form["custom-title"].btn.addEventListener("click", () => {
        submit(type, id, form[type].input.value);
    });
    // 設定連結按鈕
    form["custom-links"].btn.addEventListener("click", () => {
        submit(type, id, {
            name1: form["custom-links"].name1.value,
            name2: form["custom-links"].name2.value,
            url1: form["custom-links"].url.value,
            url2: form["custom-links"].input.value
        });
    });
    // 設定星期按鈕
    form["set-week"].btn.addEventListener("click", () => {
        submit(type, id, form["set-week"].input.value);
    });
    const listItems = document.querySelectorAll(".list__item");
    const settings = document.querySelectorAll(".btn-setting");
    const links = document.querySelectorAll(".link");
    const deleteIcon = document.querySelectorAll(".list__item--delete");
    const currentNum = document.querySelectorAll(".current__num");
    const current_check = document.querySelectorAll(".check");
    const current_cross = document.querySelectorAll(".cross");

    let settingIndex = 0;
    let linksIndex = 0;

    for (let i = 0; i < deleteIcon.length; i++) {
        settingListener(settings, settingIndex);
        settingIndex++;
        settingListener(settings, settingIndex);
        settingIndex++;
        settingListener(settings, settingIndex);
        settingIndex++;
        linksListener(links, linksIndex);
        linksIndex++;
        linksListener(links, linksIndex);
        linksIndex++;
        currentNum[i].addEventListener("click", (event) => {
            id = event.target.dataset.id;
            document.getElementById("current_num-form").style.display = "flex";
        });

        // 刪除作品
        deleteIcon[i].addEventListener("click", (event) => {
            dialog.showMessageBox({
                type: "warning",
                title: "刪除作品",
                detail: `確定要刪除?\n作品ID:${event.target.dataset.id}`,
                buttons: ["YES", "NO"]
            }, (e) => {
                if (e === 1) {
                    return;
                };
                ipcRenderer.send("delete-anime", event.target.dataset.id);
            });
        })
        // current +
        current_check[i].addEventListener("click", (event) => {
            // const div = document.createElement("div");
            // const p = document.createElement("p");
            // p.textContent = "Complete";
            // div.classList.add("complete");
            // p.classList.add("complete__text");
            // div.appendChild(p);
            // listItems[i].appendChild(div);


            currentNum[i].textContent++;

            ipcRenderer.send("set-current", currentNum[i].dataset.id, currentNum[i].textContent);
        })
        // current - 
        current_cross[i].addEventListener("click", (event) => {
            if (currentNum[i].textContent <= 0) {
                return;
            }
            // if (listItems[i].lastChild.classList && listItems[i].lastChild.classList.contains("complete")) {
            //     listItems[i].removeChild(listItems[i].lastChild)
            // }
            currentNum[i].textContent--;
            ipcRenderer.send("set-current", currentNum[i].dataset.id, currentNum[i].textContent);
        })
    }

    // 設定連結
    function settingListener(settings, index) {
        settings[index].addEventListener("click", () => {
            type = settings[index].dataset.req;
            id = settings[index].dataset.id;
            form[type].form.style.display = "flex";
        });
    };

    // 已預設瀏覽器開啟連結
    function linksListener(links, index) {
        links[index].addEventListener("click", (e) => {
            shell.openExternal(e.target.dataset.url);
        });
    }
    // test 
    //document.querySelector(".list__item").innerHTML += `<div class="complete"><p class="complete__text">Complete</p></div>`;
});

// 直接設定current
document.getElementById("current_num-btn").addEventListener("click", currentFormSubmit);
document.getElementById("current_num-input").addEventListener("keypress", (e) => {
    if (e.keyCode === 13) {
        currentFormSubmit()
    }
})
document.getElementById("current_num-form").addEventListener("click",function(event){
    hideForm(event,this);
});

function submit(type, id, data) {
    ipcRenderer.send(type, id, data);
}

function currentFormSubmit(){
    const num = document.getElementById("current_num-input").value;
    if (num < 0) {
        return;
    }
    document.querySelector(`.current__num[data-id="${id}"]`).textContent = num;
    ipcRenderer.send("set-current", id, num);
    document.getElementById("current_num-form").style.display = "none";
}

function hideForm(event,element){
    if (event && event.target === element) {
        element.style.display = "none";
    }
}