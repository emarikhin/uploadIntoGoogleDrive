'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const config = require('config');

var folderId = config.folderId;
var logPath = config.logPath;

async function uploadFile(file, folder) {

    var authFile = path.join(__dirname, './config/auth.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: authFile,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const service = google.drive({version: 'v3', auth});

    var uploadName = file.split(logPath)[1].split('/')[1]; // remove the fixed path prefix a leave only file name

    const fileMetadata = {
        name: uploadName,
        parents: [folder],
    };

    const media = {
        mimeType : 'application/tar',
        body: fs.createReadStream(file),
    };

    try {
        console.log('uploading', file);
        const file = await service.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });
        console.log('File Id:', file.data.id);
        return file.data.id;
    } catch (err) {
        throw err;
    }
}

function main() {
    var today = 'test_full' + JSON.parse(JSON.stringify(new Date())).slice(0,13); // 
    var findOriginalFile = new RegExp(`${today}`, 'gi');
    var filenames = fs.readdirSync(logPath);
    var todaysFile = filenames.filter(file => file.match(findOriginalFile)).toString();

    if (!!todaysFile) {
        console.log('todaysFile', todaysFile);
        const fileName = path.join(__dirname, todaysFile);
        uploadFile(fileName, folderId).catch(console.error);
    } else {
        throw new Error('file to upload not found in the folder')
    }
}

main();
