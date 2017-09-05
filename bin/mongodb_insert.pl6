#!/usr/bin/env perl6

use BSON::Document;
use MongoDB::Client;

sub MAIN(:$surname, :$goes-by, :$given-names, :$maiden-name, :$full-name, :$sex, :$landline-telephone, :$mobile-telephone, :$email) {
    my $client = MongoDB::Client.new(:uri('mongodb://'));
    my $database = $client.database('myPim');

    my $req = BSON::Document.new: (
      insert => 'persons',
      documents => [
        (
          name => $name,
        ),
      ]
    );
    $database.run-command($req);
}
