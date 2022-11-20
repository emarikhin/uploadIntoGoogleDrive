'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const config = require('config');

var folderId = config.folderId;
var logPath = config.logPath;
var logName = config.logName;

async function uploadFile(fileName) {

    var authFile = path.join(__dirname, './config/auth.json');

    const auth = new google.auth.GoogleAuth({
        keyFile: authFile,
        scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const service = google.drive({version: 'v3', auth});

    var uploadName = fileName.split(logPath)[1].split('/')[1]; // remove the fixed path prefix and leave only file name

    const fileMetadata = {
        name: uploadName,
        parents: [folderId],
    };

    const media = {
        mimeType : 'application/tar',
        body: fs.createReadStream(fileName),
    };

    try {
        console.log('uploading', fileName);
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
    var currentHour = logName + JSON.parse(JSON.stringify(new Date())).slice(0,13); // timestamp will be used in regex to find the latest file. If run hourly, the regex will be YYYY-MM-DDTHH
    var findFileToUpload = new RegExp(`${currentHour}`, 'gi');
    var filenames = fs.readdirSync(logPath);
    var fileToUpload = filenames.filter(file => file.match(findFileToUpload)).toString(); // the file we're going to upload

    if (!!fileToUpload) {
        console.log('fileToUpload:', fileToUpload);
        const logToUpload = path.join(logPath, fileToUpload);
        uploadFile(logToUpload).catch(console.error);
    } else {
        throw new Error('File to upload not found in the folder')
    }
}

main();
