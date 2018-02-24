const electron = require('electron');
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu
} = electron;

const fs = require("fs");
const path = require('path');
const url = require('url');

//require("electron-reload")(__dirname);

// delete
ipcMain.on("delete-anime", (e, id) => {
  console.log("delete:", id);
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    data = JSON.parse(data);
    delete data[id];
    fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(data), (err) => {
      if (err) {
        throw new Error(err);
      }
      console.log("write file");
      mainWindow.reload();
    });
  })
});

// settings
ipcMain.on("custom-title", (e, id, title) => {
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    data = JSON.parse(data);
    data[id].title_custom = title;
    fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(data), (err) => {
      if (err) {
        throw new Error(err);
      }
      console.log("write file");
      mainWindow.reload();
    });
  })
});

ipcMain.on("custom-links", (e, id, form) => {
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    data = JSON.parse(data);
    if (data[id].link1 === "undefined" || form.name1 === "*") {
      data[id].link1 = {
        name: "未定義",
        url: "#"
      };
    }
    if (data[id].link2 === "undefined" || form.name2 === "*") {
      data[id].link2 = {
        name: "未定義",
        url: "#"
      };
    }
    const link1 = JSON.parse(data[id].link1);
    const link2 = JSON.parse(data[id].link2);
    if (form.name1.length > 0 && form.name1 !== "*") {
      link1.name = form.name1;
      data[id].link1 = JSON.stringify(link1);
    }
    if (form.name2.length > 0 && form.name2 !== "*"){
      link2.name = form.name2;
      data[id].link2 = JSON.stringify(link2);
    } 
    if (form.url1.length > 0 && form.url1 !== "*"){
      link1.url = form.url1;
      data[id].link1 = JSON.stringify(link1);
    }
    if (form.url2.length > 0 && form.url2 !== "*"){
      link2.url = form.url2;
      data[id].link2 = JSON.stringify(link2);
    }
    
    fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(data), (err) => {
      if (err) {
        throw new Error(err);
      }
      console.log("write file");
      mainWindow.reload();
    });
  })
})

ipcMain.on("set-week", (e, id, week) => {
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    data = JSON.parse(data);
    data[id].week = week;
    fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(data), (err) => {
      if (err) {
        throw new Error(err);
      }
      console.log("write file");
      mainWindow.reload();
    });
  })
})

ipcMain.on("set-current",(e,id,num)=>{
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    data = JSON.parse(data);
    data[id].current = num;
    fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(data), (err) => {
      if (err) {
        throw new Error(err);
      }
      console.log("write file");
    });
  })
});

// adding new anime

ipcMain.on("read-file", (e, day) => {
  if (!fs.existsSync(`${app.getPath("appData")}/FeiZhai/user-data.json`)) {
    e.sender.send("show-content", 0);
    return;
  }
  fs.readFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, (err, data) => {
    const fileData = JSON.parse(data);
    const all = Object.keys(fileData).length;
    if (day === "*") {
      e.sender.send("show-content", fileData, all);
      return;
    } else if (day === "!") {
      Object.entries(fileData).forEach(([key, value]) => {
        if (value.week !== "0") {
          delete fileData[key];
        }
      });
      e.sender.send("show-content", fileData, all);
    } else if (day >= 1 && day <= 7) {
      Object.entries(fileData).forEach(([key, value]) => {
        if (value.week != day) {
          delete fileData[key];
        }
      });
      e.sender.send("show-content", fileData, all);
    }
  })
});

ipcMain.on("new-anime", (e, data) => {
  if (!fs.existsSync(`${app.getPath("appData")}/FeiZhai`)) {
    fs.mkdir(`${app.getPath("appData")}/FeiZhai`, (err) => {
      if (err) {
        throw new Error(err);
      }
    })
  }
  if (!fs.existsSync(`${app.getPath("appData")}/FeiZhai/user-data.json`)) {
    fs.writeFileSync(`${app.getPath("appData")}/FeiZhai/user-data.json`, "{}");
  }
  let file = fs.readFileSync(`${app.getPath("appData")}/FeiZhai/user-data.json`);

  let myData = JSON.parse(file);
  if (myData[data.id]) {
    console.log("exists");
    return;
  }
  myData[data.id] = data;
  fs.writeFile(`${app.getPath("appData")}/FeiZhai/user-data.json`, JSON.stringify(myData), (err) => {
    if (err) {
      throw new Error(err);
    }
    console.log("write file");
  });
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  //mainWindow.openDevTools();
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  };
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit",(event)=>{
  // 使下次啟動時顯示頁面為當日
  mainWindow.webContents.send("quit-app","quitting app");
});