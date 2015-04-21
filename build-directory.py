from directory_tree_builder import directory_manager

manager = directory_manager.DirectoryManager("gen/zadaci-pdf")
manager.build_from_spreadsheet(True, False, False)
