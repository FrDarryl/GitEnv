#!/usr/bin/env python3

import PyPDF2
import sys

pdfFilePath = sys.argv[1]
pdfFileObj = open(pdfFilePath, 'rb')
pdfReader = PyPDF2.PdfFileReader(pdfFileObj)

for pageNum in range(pdfReader.numPages):
    pageObj = pdfReader.getPage(pageNum)
    print(pageObj.extractText())

