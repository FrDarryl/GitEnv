#!/usr/bin/perl -w
# Purpose: Insert each Worksheet, in an Excel Workbook, into an existing MongoDB, of the same name as the Excel(.xls).
#          The worksheet names are mapped to the collection names, and the column named to the document hash labels.
#          Assumes each sheet is named and that the first ROW on each sheet contains the hash(field) names.
#

use strict;
use Spreadsheet::XLSX;
use MongoDB;
use MongoDB::OID;
use Tie::IxHash;

die "You must provide a filename to $0 to be parsed as an Excel file" unless @ARGV;

my $sDbName              = $ARGV[0];
$sDbName              =~ s/\.xlsx//i;
my $oExcel               = new Spreadsheet::ParseExcel;
my $oBook                = $oExcel->Parse($ARGV[0]);
my $oConn                = MongoDB->connect('mongodb://127.0.0.1:27017');
my $oDB                  = $oConn->$sDbName;
my ($sColName, %hNewDoc, $hColToInsertInto, $sFieldName, $iR, $iC, $oWkS, $oWkC);

print "FILE  :", $oBook->{File} , "\n";
print "DB: $sDbName\n";
print "Collection Count :", $oBook->{SheetCount} , "\n";

for(my $iSheet=0; $iSheet < $oBook->{SheetCount} ; $iSheet++)
{
    $oWkS                   = $oBook->{Worksheet}[$iSheet];
    $sColName               = $oWkS->{Name};
    $hColToInsertInto       = $oDB->$sColName;
    print "Collection(WorkSheet name):", $sColName, "\n";
    for(my $iR   = $oWkS->{MinRow} ; defined $oWkS->{MaxRow} && $iR <= $oWkS->{MaxRow} ;  $iR++)
    {
        tie ( %hNewDoc, "Tie::IxHash");
        for(my $iC = $oWkS->{MinCol} ; defined $oWkS->{MaxCol} && $iC <= $oWkS->{MaxCol} ; $iC++)
        {
            $sFieldName           = $oWkS->{Cells}[$oWkS->{MinRow}][$iC]->Value;
            $oWkC                 = $oWkS->{Cells}[$iR][$iC];
            $hNewDoc{$sFieldName} = $oWkC->Value if($oWkC && $sFieldName);
        }
        $hColToInsertInto->insert(\%hNewDoc);
    }
    print "Documents inserted(Rows):", ($oWkS->{MaxRow} - $oWkS->{MinRow}), "\n";
}
