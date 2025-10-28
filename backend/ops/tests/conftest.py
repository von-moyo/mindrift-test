"""
Pytest configuration for ops tests.

We ignore the legacy test_db.py file to avoid a module name collision with
commerce/tests/test_db.py during full-suite collection. The new tests live in
test_db_ops.py with a unique basename.
"""

collect_ignore = ["test_db.py"]
