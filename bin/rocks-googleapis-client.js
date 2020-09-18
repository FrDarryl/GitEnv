const AppRoot  = require('app-root-path');
const fs       = require('fs');
const {google} = require('googleapis');
const readline = require('readline');
const sheetRock = require('./sheet-rock.js');

SCOPES           = ['https://www.googleapis.com/auth/spreadsheets']; // If modifying delete file at TOKEN_PATH
CREDENTIALS_PATH = AppRoot + '/auth/credentials.json';
TOKEN_PATH       = AppRoot + '/auth/token.json';

RocksGoogleApisClientMethod(process.argv.slice(2));

function RocksGoogleApisClientMethod(params) {
    let functionName = 'RocksGoogleApisClientMethod';
    console.log(`Entering ${functionName}`);

    fs.readFile(CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log(`${functionName}: Error loading credentials file: ${err}`);

        let methodName = params[0];
        console.log(`${functionName}: Authorising and running callback ${methodName}`);

        switch (methodName) {
            case 'UpdateEventsSheet':
                authorise(JSON.parse(content), UpdateEventsSheet, params);
                break;

            case 'UpdateBulletinDistroSheet':
                authorise(JSON.parse(content), UpdateBulletinDistroSheet, params);
                break;

            default:
                console.log(`${functionName}: Command not recognised: ${methodName}`);
                break;
        }
    });
}

function authorise(credentials, callback, params) {
    let functionName = 'rocksAuthorise';
    console.log(`Entering ${functionName}`);

    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(callback, auth, params);
        auth.setCredentials(JSON.parse(token));
        callback(auth, params);
    });
}

function getNewToken(callback, auth, params) {
    let functionName = 'getNewToken';
    console.log(`Entering ${functionName}`);

    const authUrl = auth.generateAuthUrl({access_type: 'offline', scope: SCOPES,});
    console.log(`${functionName}: Authorise this app by visiting this url: ${authUrl}`);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question(`${functionName}: Enter the code from that page here: `, (code) => {
        rl.close();
        auth.getToken(code, (err, token) => {
            if (err) {
                console.log(`${functionName}: Error while trying to retrieve access token: ${err}`);
                process,exit(1);
            }
            auth.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    console.log(`${functionName}: Error while trying to store access token: ${err}`);
                    process,exit(1);
                }
                console.log(`${functionName}: Token stored to ${TOKEN_PATH}`);
                callback(auth, params);
            });
        });
    });
}
module.exports = {
  RocksGoogleApisClientMethod,
};
