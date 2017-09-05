use v6;
use LWP::Simple;

my $html = LWP::Simple.new.get("https://www.reddit.com/r/programming/comments/6thwnx/a_review_of_perl6");
say $html;
