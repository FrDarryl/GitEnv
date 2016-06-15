#!/usr/bin/env node
"use strict";

const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const retry = require('retry');
const sleep = require('sleep');

// If modifying these scopes, delete your previously saved credentials
// // at ~/.credentials/drive-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';

const CLIENT_SECRET_PATH = TOKEN_DIR + 'client_secret.json';
const CLIENT_TOKEN_PATH = TOKEN_DIR + 'client_token.json';

console.log('Secret path: ', CLIENT_SECRET_PATH);
console.log('Token path: ', CLIENT_TOKEN_PATH);
// Load client secrets file.
fs.readFile(CLIENT_SECRET_PATH, (err, content) => {
    if (err) throw 'Error loading client secret file: ' + err;
    // Authorize a client with the loaded credentials, then call the
    // Drive API.
    authorize(JSON.parse(content), processFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const auth = new googleAuth();
    const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(CLIENT_TOKEN_PATH, (err, token) => {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err) throw 'Error while trying to retrieve access token', err;

            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client, service);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') throw err;
    }
    fs.writeFile(CLIENT_TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + CLIENT_TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function faultTolerantFileGet(service, getParms, cb) {
    let operation = retry.operation();
    //console.log('Entering faultTolerateFileGet for %s', getParms.fileId);

    operation.attempt((currentAttempt) => {
        service.files.get(getParms, (err, fileContents) => {
            if (operation.retry(err)) {
                return;
            } else {
                cb(err ? operation.mainError() : null, fileContents);
            }
        });
    });
}

function processFiles(auth) {
    const service = google.drive('v3');
    service.files.list(
      {
          auth: auth,
          q: "mimeType contains 'image' and '0BxY8FTVhdfNbemlRY3ZaWllNcFk' in parents",
          //pageSize: 10,
          fields: "nextPageToken, files(id, name)"
      },
      (err, listResponse) => {
          if (err) throw 'The files.list method returned an error: ' + err;

          console.log(listResponse);
          const files = listResponse.files;
          if (files.length == 0) {
              console.log('No files found.');
              return;
          }
          for (let i = 0; i < files.length; i++) {
              let file = files[i];

              //faultTolerantFileGet(getParms, (err, fileContents) => {
              //  service,
              console.log('Processing file %s (ID: %s)', file.name, file.id);
              let outputStream = fs.createWriteStream('./' + file.name);
              service.files.get({auth: auth,fileId: file.id})
                .on('end', () => {
                    console.log('Done');
                })
                .on('error', (err) => {
                    console.log('  Sleeping off download error', err);
                    sleep.sleep(2);
                })
                .pipe(outputStream);
          }
      }
    );
}
