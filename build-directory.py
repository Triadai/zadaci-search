from directory_tree_builder import directory_manager

manager = directory_manager.DirectoryManager("gen-zadaci")
manager.build_from_spreadsheet(True, False, False)
