directory_tree_builder:
	( git submodule init && git submodule update )
	( cd directory_tree_builder && git submodule init && git submodule update )
	[ -f _hidden_settings.py ] &&\
	 	cp _hidden_settings.py directory_tree_builder/spreadsheet_parser/

gen-zadaci-pdf: directory_tree_builder
	python build-directory.py
	
index.js:
	python 

clean:
	rm -rf directory_tree_builder gen-zadaci-pdf
