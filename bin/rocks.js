#!/usr/bin/env node
/**
* @license
* Copyright Google Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

const fs       = require('fs');
const {google} = require('googleapis');
const moment   = require('moment');
const nodeIcal = require('node-ical');
const readline = require('readline');

SCOPES           = ['https://www.googleapis.com/auth/spreadsheets']; // If modifying delete file at TOKEN_PATH
CREDENTIALS_PATH = './auth/credentials.json';
TOKEN_PATH       = './auth/token.json';

main(process.argv.slice(2));

function main(argv) {
    let functionName = 'main';
    console.log(`Entering ${functionName}`);

    fs.readFile(CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log(`${functionName}: Error loading credentials file: ${err}`);
        let callbackFunctionName = argv[0];
        console.log(`${functionName}: Authorising and running callback ${callbackFunctionName}`);

        switch (callbackFunctionName) {
            case 'UpdateEventsSheet':
                authorise(JSON.parse(content), UpdateEventsSheet, argv);
                break;

            case 'UpdateBulletinDistroSheet':
                authorise(JSON.parse(content), UpdateBulletinDistroSheet, argv);
                break;

            default:
                console.log(`${functionName}: Command not recognised: ${callbackFunctionName}`);
                break;
        }
    });
}

function authorise(credentials, callback, params) {
    let functionName = 'authorise';
    console.log(`Entering ${functionName}`);

    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback, params);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client, params);
    });
}

function getNewToken(oAuth2Client, callback) {
    let functionName = 'getNewToken';
    console.log(`Entering ${functionName}`);

    const authUrl = oAuth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES,});
    console.log(`${functionName}: Authorise this app by visiting this url: ${authUrl}`);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question(`${functionName}: Enter the code from that page here: `, (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log(`${functionName}: Error while trying to retrieve access token: ${err}`);
                process,exit(1);
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    console.log(`${functionName}: Error while trying to store access token: ${err}`);
                    process,exit(1);
                }
                console.log(`${functionName}: Token stored to ${TOKEN_PATH}`);
                callback(oAuth2Client, params);
            });
        });
    });
}

const arrayColumn = (arr, n) => arr.map(x => x[n]);

const BulletinDistroSheet = {
    name: 'BulletinDistro',
    getRange: 'A',
    putRange: 'A1',
    rows: [],
    putRows: [],
    resource: {},
}
const CalendarsSheet = {
    name: 'Calendars',
    getRange: 'A:B',
    putRange: 'A:B',
    rows: [],
    putRows: [],
    idColNum: 1,
    idColumn: [],
    resource: {}
}
const EventsSheet = {
    name: 'Events',
    getRange: 'A:G',
    putRange: 'A:G',
    rows: [],
    putRows: [],
    idColNum: 1,
    idColumn: [],
    resource: {}
}
const EventsTemplateSheet = {
    name: 'EventsTemplate',
    getRange: 'A:N',
    putRange: 'A:N',
    rows: [],
    putRows: [],
    idColNum: 1,
    idColumn: [],
    resource: {}
}
const PersonsSheet = {
    name: 'Persons',
    getRange: 'A2:Z',
    putRange: 'A2:Z',
    rows: [],
    putRows: [],
    idColNum: 1,
    idColumn: [],
    resource: {}
}

function getSheetRows(auth, sheetData, callback, params) {
    let functionName = 'FromPersonsSheetRows';
    console.log(`Entering ${functionName}`);
    let sheetsService = google.sheets({version: 'v4', auth});
    let spreadsheetId = params[1]; // param[0] is the command to run
    sheetsService.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetData.name}!${sheetData.getRange}`,
    }, (err, res) => {
        if (err) {
            console.log(`${functionName}: googleapis returned error ${err}`);
            process.exit(1);
        }
        let rows = res.data.values;
        rows.map((row) => {
            sheetData.rows.push(row);
        });
        if ('idColNum' in sheetData) sheetData.idColumn = arrayColumn(sheetData.rows, sheetData.idColNum - 1);
        callback(auth, params);
    });
}

function putSheetRows(auth, sheetData, callback, params) {
    let functionName = 'putSheetRows';
    console.log(`Entering ${functionName}`);

    let values = sheetData.putRows;
    let resource = {
        values,
    };
    let sheetsService = google.sheets({version: 'v4', auth});
    let spreadsheetId = params[1]; // param[0] is the command to run
    sheetsService.spreadsheets.values.append({
        spreadsheetId:    spreadsheetId,
        range:            `${sheetData.name}!${sheetData.putRange}`,
        valueInputOption: 'RAW',
        resource:         resource
    }, (err, result) => {
        if (err) {
            console.log(`${functionName}: googleapis returned error ${err}`);
            process.exit(1);
        }
        callback(auth, params);
    });
}

const CalendarResource = {
    calendarsSheetId: '',
    calendarsSheetRowIndex: -1,
    location: '',
    data: {}
}

function getCalendarResource(auth, icalResource, callback, params) {
    let functionName = 'getCalendarResource';
    console.log(`Entering ${functionName}`);

    if (icalResource.location.startsWith('http')) {
        nodeIcal.fromURL(icalResource.location, function(err, data) {
            if (err) {
                console.log(`${functionName}: node-ical returned error ${err}`);
                process.exit(1);
            }
            icalResource.data = data;
            callback(auth, params);
        });
    } else {
        nodeIcal.parseFile(icalResource.location, function(err, data) {
            if (err) {
                console.log(`${functionName}: node-ical returned error ${err}`);
                process.exit(1);
            }
            icalResource.data = data;
            callback(auth, params);
        });
    }
}
//=================
function UpdateBulletinDistroSheet(auth, params) {
    let functionName = 'UpdateBulletinDistroSheet';
    console.log(`Entering ${functionName}`);

    getSheetRows(auth, PersonsSheet, UpdateBulletinDistroSheet_AppendEmails, params);
}

function UpdateBulletinDistroSheet_AppendEmails(auth, params) {
    let functionName = 'UpdateBulletinDistroSheet_AppendEmails';
    console.log(`Entering ${functionName}`);

    if (PersonsSheet.rows.length === 0) return console.log(`${functionName}: No Persons rows retrieved.`);
    // Print selective columns A-Z corresponding to indices 0-25 which pertain to vcards.
    //let values = [];
    //let resource = {
    //    values,
    //};
    BulletinDistroSheet.putRows = [];
    PersonsSheet.rows.map((row) => {
        if (`${row[1]}`.startsWith('A:') && `${row[13]}`.includes("@") ) {
            let emailDistroRow = [`\"${row[6]} ${row[7]}\" \<${row[13]}\>`];
            BulletinDistroSheet.putRows.push(emailDistroRow);
            console.log(`${functionName}: Pushing ${emailDistroRow}`);
        }
    });

    //BulletinDistroSheet.resource = resource;

    putSheetRows(auth, BulletinDistroSheet, UpdateBulletinDistroSheet_Finish, params);
}

function UpdateBulletinDistroSheet_Finish(auth, params) {
    let functionName = 'UpdateBulletinDistroSheet_Finish';
    console.log(`Entering ${functionName}`);

    console.log(`${functionName}: ${BulletinDistroSheet.putRows.length} rows appended.`);
}

//=================
function UpdateEventsSheet(auth, params) {
    let functionName = 'UpdateEventsSheet';
    console.log(`Entering ${functionName}`);

    getSheetRows(auth, CalendarsSheet, UpdateEventsSheet_GetCalendarResource, params);
}

function UpdateEventsSheet_GetCalendarResource(auth, params) {
    let functionName = 'UpdateEventsSheet_GetCalendarResource';
    console.log(`Entering ${functionName}`);

    CalendarResource.calendarsSheetId = params[2]; // [0] = spreadsheetId [1] = command ('UpdateEventsSheet')
    CalendarResource.calendarsSheetRowIndex = CalendarsSheet.idColumn.indexOf(CalendarResource.calendarsSheetId);
    if (CalendarResource.calendarsSheetRowIndex === -1) {
        console.log(`${functionName}: no location for ID ${CalendarResource.calendarsSheetId} in ${CalendarsSheet.name}; ids: ${CalendarsSheet.idColumn}`);
        process.exit(1);
    }
    CalendarResource.location = CalendarsSheet.rows[CalendarResource.calendarsSheetRowIndex][1];
    getCalendarResource(auth, CalendarResource, UpdateEventsSheet_GetEventsTemplateRows, params);
}

function UpdateEventsSheet_GetEventsTemplateRows(auth, params) {
    let functionName = 'UpdateEventsSheet_GetEventsTemplateRows';
    console.log(`Entering ${functionName}`);

    getSheetRows(auth, EventsTemplateSheet, UpdateEventsSheet_AppendEvents, params);
}

function UpdateEventsSheet_AppendEvents(auth, params) {
    let functionName = 'UpdateEventsSheet_AppendEvents';
    console.log(`Entering ${functionName}`);

    EventsSheet.putRows = [];
    for (let key in CalendarResource.data) {
        let calendarEvent = CalendarResource.data[key];
        //console.log(`${functionName}: Processing calendarEvent: ` + JSON.stringify(calendarEvent));
        UpdateEventsSheet_pushRowsForCalendarEvent(calendarEvent);
    }

    putSheetRows(auth, EventsSheet, UpdateEventsSheet_Finish, params);
}

function UpdateEventsSheet_pushRowsForCalendarEvent(calendarEvent) {
    let functionName = 'UpdateEventsSheet_pushRowsForCalendarEvent';
    console.log(`Entering ${functionName}`);

    let calendarEventDowToken = moment(calendarEvent.start).format('eddd');
    let dailyEventsCount = 0;
    while (1) {
        let calendarsSheetIdToken = `${CalendarResource.calendarsSheetId}${++dailyEventsCount}`;
        let templateSheetId       = `${calendarEventDowToken}_${calendarsSheetIdToken}`;
        let templateSheetRowIndex = EventsTemplateSheet.idColumn.indexOf(templateSheetId);
        if (templateSheetRowIndex === -1) break;

        let templateSheetRow = EventsTemplateSheet.rows[templateSheetRowIndex];
        //console.log(`${functionName}: templateSheetRow:  ${templateSheetRow}`);
        //A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P
        //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15

        let templateDateSpecifier = {
            condition:  templateSheetRow[3],
            regExp:     templateSheetRow[4],
            format:     templateSheetRow[5],
            opFunc:     templateSheetRow[6],
            opInt:      templateSheetRow[7],
            opUnit:     templateSheetRow[8]
        }

        let templateSummarySpecifier = {
            formatAs:   templateSheetRow[13],
            otherValue: templateSheetRow[14]
        }
        let newEventsSheetRow = {
            date:       moment(calendarEvent.start),
            time:       templateSheetRow[9],
            cat1:       templateSheetRow[10],
            cat2:       templateSheetRow[11],
            cat3:       templateSheetRow[12],
            summary:    calendarEvent.summary,
            pushArray:  []
        }

        newEventsSheetRow.summary = newEventsSheetRow.summary
            .replace(/,\n \(commemoration of (.+)\)/,"\n$1")
            .replace(/,\n or /g,"\n")
            .replace(/\n/g,"|");
        switch (templateSummarySpecifier.formatAs) {
            case 'HolyDayFormatAU':
                newEventsSheetRow.summary = newEventsSheetRow.summary
                    .replace(/(.+) Sunday after (Trinity)/,"$2 $1");
                break;
            case 'HolyDayFormatEF':
                newEventsSheetRow.summary = newEventsSheetRow.summary
                    .replace(/(.+) Sunday after (Epiphany|Pentecost)/,"$2 $1");
                break;
            case 'HolyDayFormatOF':
                newEventsSheetRow.summary = newEventsSheetRow.summary
                    .replace(/(.+) Sunday of (Advent|Easter|Lent|Ordinary Time)/,"$2 $1");
                break;
            case 'FirstPreferred':
                if (newEventsSheetRow.summary.includes("|")) newEventsSheetRow.summary
                    .split("|")[0];
                break;
            case 'SecondPreferred':
                if (newEventsSheetRow.summary.includes("|")) newEventsSheetRow.summary
                    .split("|")[1];
                break;
            case 'Other':
                newEventsSheetRow.summary = templateSummarySpecifier.otherValue;
                break;
            default:
                console.log(`${functionName}: templateSummarySpecifier.formatAs ${templateSummarySpecifier.formatAs} not recognised`);
                break;

        }
        //console.log(`${functionName}: templateDateSpecifier.condition ${templateDateSpecifier.condition}`);
        if (templateDateSpecifier.condition === 'SummaryDoesNotMatch') {
            let templateRegExp = new RegExp(templateDateSpecifier.regExp, "g");
            if (templateRegExp.test(newEventsSheetRow.summary)) continue;
        } else if (templateDateSpecifier.condition === 'SummaryMatches') {
            let templateRegExp = new RegExp(templateDateSpecifier.regExp, "g");
            if (! templateRegExp.test(newEventsSheetRow.summary)) continue;
        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsNotLast")) {
            if (isLastMonthwiseDayOfWeek(moment(calendarEvent.start))) continue;
        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsLast")) {
            if (! isLastMonthwiseDayOfWeek(moment(calendarEvent.start))) continue;
        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsNot")) {
            let templateMonthwiseOrdinal = templateDateSpecifier.condition.replace(/DayOfWeekIsNot(.+)InMonth/,"$1");
            let calendarMonthwiseOrdinal = getMonthwiseOrdinal(moment(calendarEvent.start));
            if (templateMonthwiseOrdinal === calendarMonthwiseOrdinal) continue;
        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIs")) {
            let templateMonthwiseOrdinal = templateDateSpecifier.condition.replace(/DayOfWeekIs(.+)InMonth/,"$1");
            let calendarMonthwiseOrdinal = getMonthwiseOrdinal(moment(calendarEvent.start));
            if (templateMonthwiseOrdinal !== calendarMonthwiseOrdinal) continue;
        }

        if (templateDateSpecifier.opFunc === 'add') {
            newEventsSheetRow.date = moment(newEventsSheetRow.date).add(templateDateSpecifier.opInt, templateDateSpecifier.opUnit);
        } else if (templateDateSpecifier.opFunc === 'subtract') {
            newEventsSheetRow.date = moment(newEventsSheetRow.date).subtract(templateDateSpecifier.opInt, templateDateSpecifier.opUnit);
        }

        if (templateDateSpecifier.format !== '') {
            newEventsSheetRow.date = moment(newEventsSheetRow.date).format(templateDateSpecifier.format);
        }
        newEventsSheetRow.pushArray = [
            '',
            newEventsSheetRow.date,
            newEventsSheetRow.time,
            newEventsSheetRow.cat1,
            newEventsSheetRow.cat2,
            newEventsSheetRow.cat3,
            newEventsSheetRow.summary,
        ];
        console.log(`${functionName}: Pushing ${newEventsSheetRow.pushArray}`);
        EventsSheet.putRows.push(newEventsSheetRow.pushArray);
    }
    return;
}

function isLastMonthwiseDayOfWeek(inDate) {
    let functionName = 'isLastMonthwiseDayOfWeek';
    console.log(`Entering ${functionName}`);

    let inDateDayName = moment(inDate).format('ddd');
    let inDateMonthName = moment(inDate).format('MMM');

    let nextDayDate = moment(inDate).add(1, 'days');
    while (moment(nextDayDate).format('ddd') !== inDateDayName) {
        if (moment(nextDayDate).format('MMM') !== inDateMonthName) return true;
        nextDayDate = moment(nextDayDate).add(1, 'days');
    }
    return false;
}

function getMonthwiseOrdinal(date) {
    let functionName = 'getMonthwiseOrdinal';
    console.log(`Entering ${functionName}`);

    let dayInMonth = moment(date).format("DD");
    let monthwiseOrdinal = 'Fifth';
    if        (dayInMonth < 8) {
        monthwiseOrdinal = 'First';
    } else if (dayInMonth < 15) {
        monthwiseOrdinal = 'Second';
    } else if (dayInMonth < 22) {
        monthwiseOrdinal = 'Third';
    } else if (dayInMonth < 29) {
        monthwiseOrdinal = 'Fourth';
    }
    return monthwiseOrdinal;
}

function UpdateEventsSheet_Finish(auth, params) {
    let functionName = 'UpdateEventsSheet_Finish';
    console.log(`Entering ${functionName}`);

    console.log(`${functionName}: ${EventsSheet.putRows.length} cells appended.`);
}

module.exports = {
    UpdateBulletinDistroSheet,
    UpdateEventsSheet,
};
