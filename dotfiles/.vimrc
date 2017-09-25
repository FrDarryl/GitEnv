"
" Remove ALL autocommands to allow redefines at initial load and runtime source
autocmd!

runtime bundle/vim-pathogen/autoload/pathogen.vim
call pathogen#infect()
call pathogen#helptags()

if has("eval")    " Enable filetype settings
    filetype on
    filetype plugin on
    filetype indent on
endif

if has("autocmd")
    aug vimrc
    au!
    " restore cursor position when the file has been read
    au BufReadPost *
    \ if line("'\"") > 0 && line("'\"") <= line("$") |
    \ exe "norm g`\"" |
    \ endif
    aug ENG
endif

set autoindent
set cursorline cursorcolumn
set expandtab
set ignorecase   " Search terms not case-sensitive by default
set ff=unix
set hlsearch
set nocompatible              " be iMproved, required
set nowrap
set number
set shiftwidth=4
set smartindent
set softtabstop=4
set tabstop=4
set textwidth=0  " In case someone irritatingly put autosplit in a sourced file
"http://ww2.cs.fsu.edu/~stanovic/vim.html
" Tell vim to remember certain things when we exit
"  '10  :  marks will be remembered for up to 10 previously edited files
"  "100 :  will save up to 100 lines for each register
"  :20  :  up to 20 lines of command-line history will be remembered
"  %    :  saves and restores the buffer list
"  n... :  where to save the viminfo files
set viminfo='10,\"100,:500,%,n~/.viminfo

"========================================================= status bar
set laststatus=2
"set statusline=
"set statusline+=%2*%-3.3n%0*\                " buffer number
"set statusline+=%F\                          " file name
"set statusline+=%h%1*%m%r%w%0*               " flags
"set statusline+=\[%{strlen(&ft)?&ft:'none'}, " filetype
"set statusline+=%{&encoding},                " encoding
"set statusline+=%{&fileformat}]              " file format
"set statusline+=%=                           " right align
"set statusline+=%2*0x%-8B\                   " current char
"set statusline+=%-14.(%l,%c%V%)\ %<%P        " offset
"let &titlestring = hostname() . "[vim(" . expand("%:t") . ")]"
let g:airline#extensions#tabline#enabled = 1
let g:airline_section_b = '0x%B'
"========================================================== colour scheme
"colorscheme ChocolateLiquor
"colorscheme almost-default
colorscheme asmdev
"colorscheme rastafari

" Highlight EOL whitespace, http://vim.wikia.com/wiki/Highlight_unwanted_spaces
highlight ExtraWhitespace ctermbg=darkred guibg=#382424

autocmd ColorScheme * highlight ExtraWhitespace ctermbg=red guibg=red " the above flashes annoyingly while typing, be calmer in insert mode
autocmd BufWinEnter * match ExtraWhitespace /\s\+$/
autocmd InsertLeave * match ExtraWhitespace /\s\+$/
autocmd InsertEnter * match ExtraWhitespace /\s\+\%#\@<!$/

" Automagically set textwidth of text files to 72 for printing.
"autocmd BufEnter *.txt setlocal textwidth=72 formatoptions=aw2tq

" Nice cursor column (highlight always) and line (highlight only in insert mode)

autocmd BufWinEnter * set nocul
autocmd InsertEnter * set cul
autocmd InsertLeave * set nocul

" Nice title

autocmd BufEnter * let &titlestring = hostname() . "[vim(" . expand("%:t") . ")]"
"Char  Dec  Oct  Hex | Char  Dec  Oct  Hex | Char  Dec  Oct  Hex | Char Dec  Oct   Hex
"-------------------------------------------------------------------------------------
"(nul)   0 0000 0x00 | (sp)   32 0040 0x20 | @      64 0100 0x40 | `      96 0140 0x60
"(soh)   1 0001 0x01 | !      33 0041 0x21 | A      65 0101 0x41 | a      97 0141 0x61
"(stx)   2 0002 0x02 | "      34 0042 0x22 | B      66 0102 0x42 | b      98 0142 0x62
"(etx)   3 0003 0x03 | #      35 0043 0x23 | C      67 0103 0x43 | c      99 0143 0x63
"(eot)   4 0004 0x04 | $      36 0044 0x24 | D      68 0104 0x44 | d     100 0144 0x64
"(enq)   5 0005 0x05 | %      37 0045 0x25 | E      69 0105 0x45 | e     101 0145 0x65
"(ack)   6 0006 0x06 | &      38 0046 0x26 | F      70 0106 0x46 | f     102 0146 0x66
"(bel)   7 0007 0x07 | '      39 0047 0x27 | G      71 0107 0x47 | g     103 0147 0x67
"(bs)    8 0010 0x08 | (      40 0050 0x28 | H      72 0110 0x48 | h     104 0150 0x68
"(ht)    9 0011 0x09 | )      41 0051 0x29 | I      73 0111 0x49 | i     105 0151 0x69
"(nl)   10 0012 0x0a | *      42 0052 0x2a | J      74 0112 0x4a | j     106 0152 0x6a
"(vt)   11 0013 0x0b | +      43 0053 0x2b | K      75 0113 0x4b | k     107 0153 0x6b
"(np)   12 0014 0x0c | ,      44 0054 0x2c | L      76 0114 0x4c | l     108 0154 0x6c
"(cr)   13 0015 0x0d | -      45 0055 0x2d | M      77 0115 0x4d | m     109 0155 0x6d
"(so)   14 0016 0x0e | .      46 0056 0x2e | N      78 0116 0x4e | n     110 0156 0x6e
"(si)   15 0017 0x0f | /      47 0057 0x2f | O      79 0117 0x4f | o     111 0157 0x6f
"(dle)  16 0020 0x10 | 0      48 0060 0x30 | P      80 0120 0x50 | p     112 0160 0x70
"(dc1)  17 0021 0x11 | 1      49 0061 0x31 | Q      81 0121 0x51 | q     113 0161 0x71
"(dc2)  18 0022 0x12 | 2      50 0062 0x32 | R      82 0122 0x52 | r     114 0162 0x72
"(dc3)  19 0023 0x13 | 3      51 0063 0x33 | S      83 0123 0x53 | s     115 0163 0x73
"(dc4)  20 0024 0x14 | 4      52 0064 0x34 | T      84 0124 0x54 | t     116 0164 0x74
"(nak)  21 0025 0x15 | 5      53 0065 0x35 | U      85 0125 0x55 | u     117 0165 0x75
"(syn)  22 0026 0x16 | 6      54 0066 0x36 | V      86 0126 0x56 | v     118 0166 0x76
"(etb)  23 0027 0x17 | 7      55 0067 0x37 | W      87 0127 0x57 | w     119 0167 0x77
"(can)  24 0030 0x18 | 8      56 0070 0x38 | X      88 0130 0x58 | x     120 0170 0x78
"(em)   25 0031 0x19 | 9      57 0071 0x39 | Y      89 0131 0x59 | y     121 0171 0x79
"(sub)  26 0032 0x1a | :      58 0072 0x3a | Z      90 0132 0x5a | z     122 0172 0x7a
"(esc)  27 0033 0x1b | ;      59 0073 0x3b | [      91 0133 0x5b | {     123 0173 0x7b
"(fs)   28 0034 0x1c | <      60 0074 0x3c | \      92 0134 0x5c | |     124 0174 0x7c
"(gs)   29 0035 0x1d | =      61 0075 0x3d | ]      93 0135 0x5d | }     125 0175 0x7d
"(rs)   30 0036 0x1e | >      62 0076 0x3e | ^      94 0136 0x5e | ~     126 0176 0x7e
"(us)   31 0037 0x1f | ?      63 0077 0x3f | _      95 0137 0x5f | (del) 127 0177 0x7f
set iskeyword+=36,48-58,63,65-90 " variables = $,0-9,A-Z,a-z,_
set iskeyword+=35-38,45-47 " urls = variables + #$%&,-./

"========================================================= key/command mapping
let mapleader = ","

cmap dlw %s/^\s\+//gc
cmap dna %s/[\x7f-\xff]//gc
"%s/‘/'/g
"%s/’/'/g
"%s/“/"/g
"%s/”/"/g

cmap dtw %s/\s\+$//gc
cmap hna match Error /[\x7f-\xff]/
cmap pdb ConqueGdb python
cmap udc %! perl -C -MText::Unidecode -n -i -e'print unidecode( $_)'
cmap w!! w !sudo tee % >/dev/null

nmap <C-T> <ESC>:tabnew 

nmap <silent> <A-Down>  :bnext!<CR>      " Buffer navigation (within current window)
nmap <silent> <A-Left>  :tabprevious!<CR> " Also: gT
nmap <silent> <A-Right> :tabnext!<CR>     " Also: gt
nmap <silent> <A-Up>    :bprevious!<CR>   " Buffer navigation (within current window)
nmap <silent> <F2>  :join<CR>0
nmap <silent> <F11> :cal VimCommanderToggle()<CR>

":for i in range(1,125) | put ='=TRANSPOSE(PostTownsReference!'.i.':'.i.')' | endfor
":%perldo s/([\w-]+?)_([\w-]*?)_([\w-]+?)_(churches|workplaces|religiousCommunities|cemeteries)/\U$1\E_$2_$3_$4/g)

"======================================================== function declarations

function! s:FixWhitespace(line1,line2)
    let l:save_cursor = getpos(".")
    silent! execute ':' . a:line1 . ',' . a:line2 . 's/\s\+$//'
    call setpos('.', l:save_cursor)
endfunction

function! s:FixCalendar(...)
    %g/^URL:/normal dd
    %s/\(http:\/\/www.universalis.com\)*\/Europe\.England\.//
    %s/\/\(today\.htm\)*$//
endfunction

function! WordProcessorMode()
    setlocal formatoptions=t1
    setlocal textwidth=72
    map j gj
    map k gk
    setlocal smartindent
    setlocal spell spelllang=en_gb
    setlocal noexpandtab
endfunction
cmap WP call WordProcessorMode()

function! CreateBufferQuotidianLectionary()
    let l:lectionaryDate = input('Enter date (YYYYMMDD):[today]')
    if l:lectionaryDate == ""
        let l:lectionaryDate = strftime("%Y%m%d")
    endif
    execute 'read !get_universalis_texts.sh ' . l:lectionaryDate
endfunction
cmap QL call CreateBufferQuotidianLectionary()

" Plugin options

let g:NERDTreeShowHidden=1

if has("folding") " Enable folds
    set foldenable
    set foldmethod=indent
    set foldlevel=10
endif

set shell=bash\ --login

source ~/.vim/osc52.vim
vmap <C-c> y:call SendViaOSC52(getreg('"'))<cr>

" Must be at the end
syntax on
