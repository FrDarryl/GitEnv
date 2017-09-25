#!/usr/bin/perl -w

use strict;
use Text::Iconv;
my $converter = Text::Iconv -> new ("utf-8", "windows-1251");

# Text::Iconv is not really required.
# This can be any object with the convert method. Or nothing.

use Spreadsheet::XLSX;

die "You must provide a filename to $0 to be parsed as an Excel file" unless @ARGV;

my $excel = Spreadsheet::XLSX -> new (@ARGV[0], $converter);

foreach my $sheet (@{$excel -> {Worksheet}}) {
    printf("Sheet: %s\n", $sheet->{Name});

    $sheet -> {MaxRow} ||= $sheet -> {MinRow};

    foreach my $row ($sheet -> {MinRow} .. $sheet -> {MaxRow}) {

        $sheet -> {MaxCol} ||= $sheet -> {MinCol};

        foreach my $col ($sheet -> {MinCol} ..  $sheet -> {MaxCol}) {

            my $cell = $sheet -> {Cells} [$row] [$col];

            if ($cell) {
                printf("( %s , %s ) => %s\n", $row, $col, $cell -> {Val});
            }
        }
    }
}
