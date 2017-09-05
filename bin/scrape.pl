use v6;

use Gumbo;
use XML;
use HTTP::UserAgent;

#We define some base url, notice that I don't use https
my $bbaseurl = "http://www.fimfiction.net/bookshelf/";
my $fimbaseurl = "http://www.fimfiction.net/";

my $bookshelfid = @*ARGS[0];

my $url = $bbaseurl~$bookshelfid;
my $ua = HTTP::UserAgent.new;
#Fimfiction hide mature content (violent story/sex stories) as default.
$ua.cookies.set-cookie('Set-Cookie:view_mature=true; ');

#HTTP::UserAgent give us a response object
my $rep = $ua.get($url);

if ! $rep.is-success {
    die "Can't contact $url" ~ $rep.status-line;
}

#First we are only interested in the number of page

# We could have only called parse-html($rep.content) and search on the xml tree created
# But parse-html provided by Gumbo offer some basic filtering, that speed up the parsing
# :SINGLE make it stop at the first element that match div class="page_list"
# :nowhitespace tell him to not add all the whitespaces that are outside elements (like identation tab)
my $xmldoc = parse-html($rep.content, :TAG<div>, :class<page_list>, :SINGLE, :nowhitespace);

# Note: $xmldoc contains the html tag as root, not the <div>
# We don't care for the <ul> or extra content of this div, so let get all the <li> tags

my @pages_li = $xmldoc.lookfor(:TAG<li>);

my $number_of_page = 1;

#if we have more than one <li>
if @pages_li.elems > 1 {
    # get the text of the second last element 
    $number_of_page = @pages_li[@pages_li.elems-2][0][0].text;
}

say "Bookshelf nÂ°$bookshelfid has $number_of_page page(s)";
