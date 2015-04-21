#!/bin/bash

zadaci_dir=gen-zadaci-pdf

find $zadaci_dir -regex '.*pdf$' | cut -f3- -d'/' | while read path; do
  kljuc=$(echo $(dirname $path) | sed 's/[0-9][0-9]-//' | sed -s 's/\//-/g')
  
  echo $kljuc
done
