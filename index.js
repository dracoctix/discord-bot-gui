const electron = require('electron');
const {app, BrowserWindow, ipcMain} = electron;
const Discord = require('discord.js');
const discordClient = new Discord.Client();


let tokenWindow, mainWindow;
let guilds, guildChannels;

let actualChannel = null;

/**
 * Start of windows management
 */
function createTokenWindow() {
    tokenWindow = new BrowserWindow({
        width: 600,
        height: 300,
        center: true,
        title: "Please enter the bot token",
        resizable: false,
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
    });
    tokenWindow.loadFile('front/token.html');
    tokenWindow.on('closed', () => {
        tokenWindow = null;
    });
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        title: "Bot management",
        resizable: true,
        minimizable: true,
        maximizable: true,
        autoHideMenuBar: true,
        enableLargerThanScreen: true,
    });

    mainWindow.loadFile('front/main.html');
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('window-all-closed', () => {
    discordClient.destroy();
    app.quit();
});
app.on('ready', createTokenWindow);

/**
 * End of Windows Management
 * Start of Discord Bot Management
 */
discordClient.on('ready', () => {
    createMainWindow();
    tokenWindow.close();
});

discordClient.on('error', (err) => {
    electron.dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'An error occurred !',
        message: `An error occurred with the bot connexion.\n(Error : ${err.message})\n`,
        buttons: ['Disconnect', 'Continue'],
    }, (response => {
        if(response === 0) {
            createTokenWindow();
            mainWindow.close();
        }
    }));
});

discordClient.on('message', (message) => {
    if(message.channel === actualChannel) {
        let sendPromise = mainWindow.webContents.send('newmessage', message);
        sendPromise.then(null, (err) => {
            electron.dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'The message cannot be sent',
                message: `The message cannot be sent.\n(Error : ${err.message})`,
            });
        });
    }
});
/**
 * End of Discord Bot Management
 * Start of IPC Management
 */

// We manage now IPC :
ipcMain.on('tokenSent', (event, token) => {
    const loginPromise = discordClient.login(token);
    loginPromise.then(null, (err) => {
        electron.dialog.showMessageBox(tokenWindow, {
            type: 'error',
            title: 'Bot connexion failed',
            message: `The connexion to the bot failed.\n(Error : ${err.message})`,
        },() => {
            tokenWindow.webContents.send('tokenFailed');
        });
    });
});

ipcMain.on('loaded', (event) => {
    guilds = discordClient.guilds.array();
    event.sender.send('init', guilds);
});

ipcMain.on('changesrv', (event, id) => {
    actualChannel = null;
    let server = discordClient.guilds.get(id);
    guildChannels = server.channels.array();
    event.sender.send('srvinfo', guildChannels);
});

ipcMain.on('changechannel', (event, id) => {
    actualChannel = discordClient.channels.get(id);

    event.sender.send('channelok');
});

ipcMain.on('post', (event , message) => {
    actualChannel.send(message);
});

/**
 * End of IPC Management
 */