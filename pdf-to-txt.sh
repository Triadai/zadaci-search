#!/bin/bash

zadaci_dir=gen/zadaci-pdf
output=gen/zadaci-txt

rm -rf $output
mkdir -p $output

letters=$(cat croatian-helper/txt/letters.txt)
letters2ascii=$(cat croatian-helper/txt/letters2ascii.txt)

find $zadaci_dir -regex '.*pdf$' | while read path; do
  kljuc=$(echo $(dirname $path) | cut -f4- -d'/' \
          | sed -s 's/\//\@/g')
  txt_out=$output/$kljuc.txt
  pdftotext $path $txt_out
done

