# Lessons Learned

## File Splitting (Feb 2026)
- **Lift block-scoped variables to global scope** — when extracting code into separate files, variables defined inside blocks (e.g. `const x = ...` inside an `else{}`) are invisible to other files. Move them to the top level before splitting.
- **Strip wrapper tags after extraction** — sed extraction includes `<style>` and `<script>` tags from the original HTML. Always remove them from the extracted CSS/JS files or they will silently break.
