all: client/search.js

directory_tree_builder/spreadsheet_parser/_hidden_settings.py:
	( git submodule init && git submodule update )
	( cd directory_tree_builder && git submodule init && git submodule update )
	[ -f _hidden_settings.py ] &&\
	 	cp _hidden_settings.py directory_tree_builder/spreadsheet_parser/

croatian-helper:
	( git submodule init && git submodule update )
	( cd croatian-helper/lib && npm install )

gen/zadaci-pdf: directory_tree_builder/spreadsheet_parser/_hidden_settings.py build-directory.py
	rm -rf gen/zadaci-pdf
	python build-directory.py

gen/zadaci-txt: gen/zadaci-pdf croatian-helper pdf-to-txt.sh
	rm -rf gen/zadaci-txt
	./pdf-to-txt.sh

gen/zadaci-words: gen/zadaci-txt txt-to-words.js
	rm -rf gen/zadaci-words;\
	mkdir -p gen/zadaci-words;\
	for i in $$(ls gen/zadaci-txt); do\
		node txt-to-words.js gen/zadaci-txt/$$i > gen/zadaci-words/$$i;\
	done
	
gen/index.json: gen/zadaci-words build-index.js
	node build-index.js > gen/index.json

client/search.js: gen/index.json client/search.template.js
	cat client/search.template.js gen/index.json > client/search.js

clean:
	rm -rf gen client/search.js
