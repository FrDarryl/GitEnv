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

const appRoot  = require('app-root-path');
const {google} = require('googleapis');
const moment   = require('moment');
const nodeIcal = require('node-ical');

const arrayColumn = (arr, n) => arr.map(x => x[n]);
//A1 notation
//Some API methods require a range in A1 notation. This is a string like Sheet1!A1:B2, that refers to a group of cells in the spreadsheet, and is typically used in formulas. For example, valid ranges are:
//
// Sheet1!A1:B2 refers to the first two cells in the top two rows of Sheet1.
// Sheet1!A:A refers to all the cells in the first column of Sheet1.
// Sheet1!1:2 refers to the all the cells in the first two rows of Sheet1.
// Sheet1!A5:A refers to all the cells of the first column of Sheet 1, from row 5 onward.
// A1:B2 refers to the first two cells in the top two rows of the first visible sheet.
// Sheet1 refers to all the cells in Sheet1.
//
//https://developers.google.com/sheets/api/guides/concepts

class SheetRock {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        this.fieldNamesRowIndex = 0;
        this.fieldNames = [];
        this.fieldSpecsRowIndex = 1;
        this.fieldTypes = [];
        this.fieldSorts = [];
        this.firstDataRowIndex = 2;
        this.getRange = 'A3:ZZ';
        this.getRows = [];
        this.putRange = 'A3:A';
        this.putRows = [];
        this.resource = {};
    }
}
class IndexedSheetRock extends SheetRock {
    constructor() {
        this.idColumnIndex;
        this.ids = [];
    }
}

class VFile {
    constructor(name, type, path, url) {
        this.name = name;
        this.type = type; // vcard or vcal
        this.path = path;
        this.url = url

        this.data = {};
    }
}

const BulletinDistroSheet = {
    name: 'BulletinDistro',
    getRange: 'A:A',
    propertiesRowIndex: -1,
    properties: [],
    idColNum: -1,//no ids
    uniqueIDs: [],
    putRange: 'A:A',
    rows: [],
    putRows: [],
    resource: {},
}

const CalendarResource = {
    calendarsSheetId: '',
    calendarsSheetRowIndex: -1,
    location: '',
    data: {}
}

const CalendarsSheet = {
    name: 'Calendars',
    getRange: 'A:B',
    propertiesRowIndex: -1, //no header row
    properties: [],
    uniqueIDsColumnIndex: -1,//no ids
    uniqueIDs: [],
    putRange: 'A:B',
    rows: [],
    putRows: [],
    resource: {}
}
const EventsSheet = {
    name: 'Events',
    propertiesRowIndex: 0,
    properties: [],
    metadataRowIndex: 1,
    propertyTypes: [],
    columnsSortCodes: [],
    uniqueIDsColumnIndex: 0,
    uniqueIDs: [],
    getRange: 'A:K',
    getRows: [],
    putRange: 'A3:K',
    putRows: [],
    resource: {}
}
const EventsTemplateSheet = {
    name: 'Events.Template',
    getRange: 'A:S',
    propertiesRowIndex: 0,
    properties: [],
    uniqueIDsColumnIndex: 0,
    uniqueIDs: [],
    putRange: 'A:S',
    rows: [],
    putRows: [],
    resource: {}
}
const FamiliesTemplateSheet = {
    name: 'Families.Template',
    getRange: 'A:N',
    propertiesRowIndex: 0,
    properties: [],
    uniqueIDsColumnIndex: 0,
    uniqueIDs: [],
    putRange: 'A:N',
    rows: [],
    putRows: [],
    resource: {}
}
const PersonsSheet = {
    name: 'Persons',
    type: 'IndexedById',
    fieldNamesRowIndex: 0,
    fieldNames: [],
    fieldSpecsRowIndex: 1,
    fieldTypes: [],
    fieldSorts: [],
    firstDataRowIndex: 2,
    idsColumnIndex: 0,
    ids: [],
    getRange: 'A:ZZ',
    getRows: [],
    putRange: 'A3:ZZ',
    putRows: [],
    resource: {}
}

const PlacesSheet = {
    name: 'Places',
    getRange: 'A3:Z',
    propertiesRowIndex: 0,
    properties: [],
    uniqueIDsColumnIndex: 0,
    uniqueIDs: [],
    putRange: 'A3:Z',
    rows: [],
    putRows: [],
    resource: {}
}

function SheetRockGetRows(sheetRock, callback, auth, params) {
    let functionName = 'SheetRockGetRows';
    console.log(`Entering ${functionName}`);
    let sheetsService = google.sheets({version: 'v4', auth});
    let spreadsheetId = params[1]; // [0] is the command to run
    sheetsService.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetRock.name}!${sheetRock.getRange}`,
    }, (err, res) => {
        if (err) {
            console.log(`${functionName}: googleapis returned error ${err}`);
            process.exit(1);
        }
        // Get all data rows
        let rows = res.data.values;
        rows.map((row) => {
            sheetRock.getRows.push(row);
        });

        SheetRockGetFieldSpecs(sheetRock, callback, auth, params);
    });
}

function SheetRockGetFieldSpecs(sheetRock, callback, auth, params) {
    let functionName = 'SheetRockGetRowFieldsById';
    console.log(`Entering ${functionName}`);

    // Get fieldNames row as array
    console.log(`${functionName}: Get FieldNames from RowIndex ${sheetRock.fieldNamesRowIndex}`);
    sheetRock.fieldNames = [];
    sheetRock.getRows[sheetRock.fieldNamesRowIndex].map((fieldName, columnIndex) => {
        sheetRock.fieldNames.push(fieldName);
    });

    // Get fieldTypes row as array
    console.log(`${functionName}: Get FieldTypes from RowIndex ${sheetRock.fieldNamesRowIndex}`);
    sheetRock.fieldTypes = [];
    sheetRock.fieldSorts = [];
    sheetRock.getRows[sheetRock.fieldSpecsRowIndex].map((fieldSpec, columnIndex) => {
        let fieldType = fieldSpec;
        let fieldSort = "";
        if (fieldSpec.includes(";")) {
            fieldType = fieldSpec.split(";")[0];
            fieldSort = fieldSpec.split(";")[1];
        }
        sheetRock.fieldTypes.push(fieldType);
        sheetRock.fieldSorts.push(fieldSort);
    });
    //If indexed sheet, get ids column as array
    if (sheetRock.type === 'IndexedById') {
        sheetRock.ids = arrayColumn(sheetRock.getRows, sheetRock.idsColumnIndex);
    }

    callback(auth, params);
}

function SheetRockGetRowFieldsByID(sheetRock, rowId) {
    let functionName = 'SheetRockGetRowFieldsById';
    console.log(`Entering ${functionName}`);

    let sheetRockIdRowIndex = sheetRock.ids.indexOf(rowId);
    if (sheetRockIdRowIndex !== -1) {
        let sheetRockRow = sheetRock.getRows[sheetRockIdRowIndex];
        let sheetRockRowFields = sheetRockGetRowFields(sheetRock, sheetRockRow);
    } else {
        let sheetRockRowFields = {};
    }
    return sheetRockRowFields;
}

function SheetRockGetRowFields (sheetRock, sheetRockRow) {
    let functionName = 'SheetRockGetRowFields';
    console.log(`Entering ${functionName}`);

    let sheetRockRowFields = {};
    sheetRockRow.map((cellValue, columnIndex) => {
        let fieldName = sheetRock.fieldNames[columnIndex];
        let fieldType = sheetRock.fieldTypes[columnIndex];
        let fieldValue = (cellValue) ? cellValue : "";
        sheetRockRowFields[fieldName] = fieldValue;
        console.log(`${functionName}: columnIndex:${columnIndex}|fieldName:${fieldName}|fieldType:${fieldType}|fieldValue:\"${fieldValue}\"`);
    });
    console.log(`Exiting ${functionName}`);
    return sheetRockRowFields;
}

function SheetRockPutRows(sheetRock, callback, auth, params) {
    let functionName = 'SheetRockPutRows';
    console.log(`Entering ${functionName}`);

    let values = sheetRock.putRows;
    let resource = {
        values,
    };
    let sheetsService = google.sheets({version: 'v4', auth});
    let spreadsheetId = params[1]; // [0] is the command to run
    sheetsService.spreadsheets.values.append({
        spreadsheetId:    spreadsheetId,
        range:            `${sheetRock.name}!${sheetRock.putRange}`,
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

function getCalendarResource(icalResource, callback, auth, params) {
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

    SheetRockGetRows(PersonsSheet, UpdateBulletinDistroSheet_AppendEmails, auth, params);
}

function UpdateBulletinDistroSheet_AppendEmails(auth, params) {
    let functionName = 'UpdateBulletinDistroSheet_AppendEmails';
    console.log(`Entering ${functionName}`);

    if (PersonsSheet.getRows.length === 0) return console.log(`${functionName}: No Persons.`);
    console.log(`${functionName}: ${PersonsSheet.getRows.length} Persons.`);
    // Print selective columns A-Z corresponding to indices 0-25 which pertain to vcards.
    //let values = [];
    //let resource = {
    //    values,
    //};
    BulletinDistroSheet.putRows = [];
    PersonsSheet.getRows.slice(PersonsSheet.firstDataRowIndex).map((row, rowIndex) => {
        let person = SheetRockGetRowFields(PersonsSheet, row);
        if (person.Connection === 'Attends') {
            console.log(`${functionName}: ${person.KnownAsNames} ${person.FamilyNames} has Connection ${person.Connection}`);
            if (person.MainEmailAddress.includes("@")) {
                let bulletinDistroRow = [`\"${person.Surnames}, ${person.KnownAs}\" \<${person.MainEmailAddress}\>`];
                BulletinDistroSheet.putRows.push(bulletinDistroRow);
            } else {
                console.log(`   ${functionName}: but has no registered email...`);
            }
        }
    });

    //BulletinDistroSheet.resource = resource;

    SheetRockPutRows(BulletinDistroSheet, UpdateBulletinDistroSheet_Finish, auth, params);
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

    SheetRockGetRows(CalendarsSheet, UpdateEventsSheet_GetCalendarResource, auth, params);
}

function UpdateEventsSheet_GetCalendarResource(auth, params) {
    let functionName = 'UpdateEventsSheet_GetCalendarResource';
    console.log(`Entering ${functionName}`);

    CalendarResource.calendarsSheetId = params[2]; // [0] is the command ('UpdateEventsSheet'); [1] is the spreadsheetId
    CalendarResource.calendarsSheetRowIndex = CalendarsSheet.ids.indexOf(CalendarResource.calendarsSheetId);
    if (CalendarResource.calendarsSheetRowIndex === -1) {
        console.log(`${functionName}: no location for ID ${CalendarResource.calendarsSheetId} in ${CalendarsSheet.name}; ids: ${CalendarsSheet.ids}`);
        process.exit(1);
    }
    CalendarResource.location = CalendarsSheet.rows[CalendarResource.calendarsSheetRowIndex][1];
    getCalendarResource(CalendarResource, UpdateEventsSheet_GetEventsTemplateRows, auth, params);
}

function UpdateEventsSheet_GetEventsTemplateRows(auth, params) {
    let functionName = 'UpdateEventsSheet_GetEventsTemplateRows';
    console.log(`Entering ${functionName}`);

    SheetRockGetRows(EventsTemplateSheet, UpdateEventsSheet_AppendEvents, auth, params);
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

    SheetRockPutRows(EventsSheet, UpdateEventsSheet_Finish, auth, params);
}

function UpdateEventsSheet_pushRowsForCalendarEvent(calendarEventObj) {
    let functionName = 'UpdateEventsSheet_pushRowsForCalendarEvent';
    console.log(`Entering ${functionName}`);

    let dailyEventsCount = 0;
    while (1) {
        let eventsTemplateSheetRowObj =
            SheetRockGetSheetFieldsByID(EventsTemplateSheet,
                               moment(calendarEvent.start).format('eddd') + `_${CalendarResource.calendarsSheetId}${++dailyEventsCount}`);
        if (Object.keys(eventsTemplateSheetRowObj).length === 0) continue;

        //A  B  C  D  E  F  G  H  I  J  K  L  M  N  O  P
        //0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15

        newEventsSheetRowObj = {};
        EventsTemplateSheet.properties.map((property, index) => {
            if (EventsSheet.properties.includes(property)) {
                newEventsSheetRowObj[name] = eventsTemplateSheetRowObj[property];
            }
        });
        if (newEventsSheetRowObj.Summary !== "") {
            // Try summary prop from ical Event
            if (calendarEventObj.hasOwnProperty('summary')) {
                if (calendarEventObj.summary.hasOwnProperty('val')) {
                    newEventsSheetRowObj.summary = calendarEventObj.summary.val;
                } else {
                    newEventsSheetRowObj.summary = calendarEventObj.summary;
                }
            }
        }
//        newEventsSheetRowObj.summary = newEventsSheetRowObj.summary
//            .replace(/,\n \(commemoration of (.+)\)/,"\n$1")
//            .replace(/,\n or /g,"\n")
//            .replace(/\n/g,"|");
//        switch (eventsTemplateSheetRowObj.EventSummaryType) {
//            case 'HolyDayFormatAU':
//                newEventsSheetRowObj.Summary = newEventsSheetRow.summary
//                    .replace(/(.+) Sunday after (Trinity)/,"$2 $1");
//                break;
//            case 'HolyDayFormatEF':
//                newEventsSheetRow.Summary = newEventsSheetRow.summary
//                    .replace(/(.+) Sunday after (Epiphany|Pentecost)/,"$2 $1");
//                break;
//            case 'HolyDayFormatOF':
//                newEventsSheetRow.Summary = newEventsSheetRow.summary
//                    .replace(/(.+) Sunday of (Advent|Easter|Lent|Ordinary Time)/,"$2 $1");
//                break;
//            case 'FirstPreferred':
//                if (newEventsSheetRow.Summary.includes("|")) newEventsSheetRow.summary
//                    .split("|")[0];
//                break;
//            case 'SecondPreferred':
//                if (newEventsSheetRow.Summary.includes("|")) newEventsSheetRow.summary
//                    .split("|")[1];
//                break;
//            case 'UseValue':
//                newEventsSheetRowObj.Summary = templateSummarySpecifier.otherValue;
//                break;
//            default:
//                console.log(`${functionName}: SummaryFormatType $summaryFormatType not processed/recognised`);
//                break;
//
//        }
//        switch (eventsTemplateSheetRowObj.EventAddConditionType) {
//            case 'SummaryDoesNotMatch':
//            let templateRegExp = new RegExp(templateDateSpecifier.regExp, "g");
//            if (templateRegExp.test(newEventsSheetRow.summary)) continue;
//        } else if (templateDateSpecifier.condition === 'SummaryMatches') {
//            let templateRegExp = new RegExp(templateDateSpecifier.regExp, "g");
//            if (! templateRegExp.test(newEventsSheetRow.summary)) continue;
//        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsNotLast")) {
//            if (isLastMonthwiseDayOfWeek(moment(calendarEvent.start))) continue;
//        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsLast")) {
//            if (! isLastMonthwiseDayOfWeek(moment(calendarEvent.start))) continue;
//        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIsNot")) {
//            let templateMonthwiseOrdinal = templateDateSpecifier.condition.replace(/DayOfWeekIsNot(.+)InMonth/,"$1");
//            let calendarMonthwiseOrdinal = getMonthwiseOrdinal(moment(calendarEvent.start));
//            if (templateMonthwiseOrdinal === calendarMonthwiseOrdinal) continue;
//        } else if (templateDateSpecifier.condition.startsWith("DayOfWeekIs")) {
//            let templateMonthwiseOrdinal = templateDateSpecifier.condition.replace(/DayOfWeekIs(.+)InMonth/,"$1");
//            let calendarMonthwiseOrdinal = getMonthwiseOrdinal(moment(calendarEvent.start));
//            if (templateMonthwiseOrdinal !== calendarMonthwiseOrdinal) continue;
//        }
//
//        if (templateDateSpecifier.opFunc === 'add') {
//            newEventsSheetRow.date = moment(newEventsSheetRow.date).add(templateDateSpecifier.opInt, templateDateSpecifier.opUnit);
//        } else if (templateDateSpecifier.opFunc === 'subtract') {
//            newEventsSheetRow.date = moment(newEventsSheetRow.date).subtract(templateDateSpecifier.opInt, templateDateSpecifier.opUnit);
//        }
//
//        if (templateDateSpecifier.format !== '') {
//            newEventsSheetRow.date = moment(newEventsSheetRow.date).format(templateDateSpecifier.format);
//        }
//        newEventsSheetRow.pushArray = [
//            '',
//            newEventsSheetRow.sdate,
//            newEventsSheetRow.stime,
//            newEventsSheetRow.edate,
//            newEventsSheetRow.etime,
//            newEventsSheetRow.cat1,
//            newEventsSheetRow.cat2,
//            newEventsSheetRow.cat3,
//            newEventsSheetRow.summary,
//            newEventsSheetRow.location,
//            newEventsSheetRow.note,
//        ];
//        console.log(`${functionName}: Pushing ${newEventsSheetRow.pushArray}`);
//        EventsSheet.putRows.push(newEventsSheetRow.pushArray);
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
