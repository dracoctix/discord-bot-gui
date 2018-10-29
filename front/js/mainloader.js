const ipc = require('electron').ipcRenderer;
const htmlspecialchars = require('htmlspecialchars');
const MarkdownIt = require('markdown-it');
const markdown = new MarkdownIt;
let guildsArray, channelsGroup, voiceChannels, textChannels, channels;

function enableServerListeners() {
    $('.server-button').on('click', function() {
        let id = this.id;
        let serverId = id.replace('server', '');

        ipc.send('changesrv', serverId);
    });
}

function enableChannelListeners() {
    $('.channel-link').on('click', function() {
        let id = this.id;
        let channelId = id.replace('channel', '');

        ipc.send('changechannel', channelId);
        $('#messageszone').addClass('d-none');
    })
}

// Sort channels
function channelsSort(a, b) {
    if(a.position < b.position)
        return -1;
    else if(a.position > b.position)
        return 1;
    else
        return 0;
}

$('#messageform').on('submit', () => {
    let messageField = $('#messagefield');
    if(messageField.val() !== '') {
        ipc.send('post', messageField.val());
    }

    messageField.val('');

    return false;
});

ipc.on('init', (event, guilds) => {
    guildsArray = guilds;

    guilds.forEach((guild) => {
        $('#servers').append(`<div class='row'><button class="col-lg-12 server-button" id='server${guild.id}'>${guild.name}</button></div>`);
    });

    enableServerListeners();
});

ipc.on('srvinfo', (event, chan) => {
    $('#channels').removeClass('d-none');
    $('#channelsList').empty();

    chan.sort(channelsSort);
    channels = chan;
    channelsGroup = [];
    voiceChannels = [];
    textChannels = [];

    chan.forEach((channel) => {
        switch(channel.type) {
            case 'text':
                textChannels.push(channel);
                break;
            case 'voice':
                voiceChannels.push(channel);
                break;
            case 'category':
                channelsGroup.push(channel);
                break;
        }
    });

    channelsGroup.forEach((channel) => {
        $('#channelsList').append(`<div id="ccategory${channel.id}"><div class="row"><strong class="col-lg-12">${channel.name}</strong></div></div>`);
    });

    textChannels.forEach((channel) => {
        let parent = null;
        if(channel.parentID !== null) {
            parent = $(`#ccategory${channel.parentID}`);
        }

        if(parent === null) {
            parent = $('#channelsList');
        }

        parent.append(`<div class="row"><a href="#" class="col-lg-12 channel-link d-block" id="channel${channel.id}" title="${channel.topic}">#${channel.name}</a></div>`);
    });

    voiceChannels.forEach((channel) => {
        let parent = null;
        if(channel.parentID !== null) {
            parent = $(`#ccategory${channel.parentID}`);
        }

        if(parent === null) {
            parent = $('#channelsList');
        }

        parent.append(`<div class="row"><div class="col-lg-12">V : ${channel.name}</div></div>`)
    });

    enableChannelListeners();
});

ipc.on('channelok', () => {
    $('#messageszone').removeClass('d-none');
});

ipc.on('newmessage', (event, message) => {
    let {author, content} = message;
    content = htmlspecialchars(content);
    // content = markdown.toHTML(content);
    content = markdown.renderInline(content);
    $('#messages').append(`<div class="row col-lg-12"><div class="col-lg-12"><strong>${author.username} :</strong> ${content}</div></div>`);
});

ipc.send('loaded');
