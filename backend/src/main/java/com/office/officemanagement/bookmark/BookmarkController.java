package com.office.officemanagement.bookmark;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final BookmarkRepository repository;

    public BookmarkController(BookmarkRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Bookmark> list(@RequestParam(name = "search", required = false) String search) {
        List<Bookmark> all = repository.findByArchivedFalseOrderByNameAsc();
        if (search == null || search.isBlank()) {
            return all;
        }
        String[] words = search.trim().toLowerCase().split("\\s+");
        return all.stream()
                .filter(b -> matchesAllWords(
                        b.getName() + " " + b.getUrl() + " " + (b.getAdditionalInfo() == null ? "" : b.getAdditionalInfo()),
                        words))
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/archived")
    public List<Bookmark> archived() {
        return repository.findByArchivedTrueOrderByNameAsc();
    }

    @GetMapping("/{id}")
    public Bookmark get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(this::notFound);
    }

    @PostMapping
    public ResponseEntity<Bookmark> create(@Valid @RequestBody BookmarkRequest request) {
        Bookmark bookmark = new Bookmark();
        apply(bookmark, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(bookmark));
    }

    @PutMapping("/{id}")
    public Bookmark update(@PathVariable Long id, @Valid @RequestBody BookmarkRequest request) {
        Bookmark bookmark = repository.findById(id).orElseThrow(this::notFound);
        apply(bookmark, request);
        return repository.save(bookmark);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        Bookmark bookmark = repository.findById(id).orElseThrow(this::notFound);
        bookmark.setArchived(true);
        repository.save(bookmark);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public Bookmark restore(@PathVariable Long id) {
        Bookmark bookmark = repository.findById(id).orElseThrow(this::notFound);
        bookmark.setArchived(false);
        return repository.save(bookmark);
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw notFound();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import")
    public BookmarkImportResult importFromChrome(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        Document doc;
        try {
            doc = Jsoup.parse(file.getInputStream(), "UTF-8", "");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read file");
        }

        int imported = 0;
        int skipped = 0;
        
        // Recursively traverse the document to extract bookmarks with their folder paths
        Element body = doc.body();
        if (body != null) {
            int[] counts = parseBookmarkFolder(body, "", new int[]{imported, skipped});
            imported = counts[0];
            skipped = counts[1];
        }

        return new BookmarkImportResult(imported, skipped);
    }

    private int[] parseBookmarkFolder(Element element, String currentPath, int[] counts) {
        int imported = counts[0];
        int skipped = counts[1];
        
        for (Element child : element.children()) {
            if (child.tagName().equals("dt")) {
                // Check if this is a folder (H3) or a bookmark (A)
                Element h3 = child.selectFirst("h3");
                if (h3 != null) {
                    String folderName = h3.text().trim();
                    // Skip "Bookmarks bar" and "Other Bookmarks" - use them as folders
                    String newPath = currentPath.isEmpty() ? folderName : currentPath + "/" + folderName;
                    // Recursively parse this folder's content
                    Element dl = child.selectFirst("dl");
                    if (dl != null) {
                        counts = parseBookmarkFolder(dl, newPath, new int[]{imported, skipped});
                        imported = counts[0];
                        skipped = counts[1];
                    }
                } else {
                    Element link = child.selectFirst("a[href]");
                    if (link != null) {
                        String url = link.attr("href").trim();
                        String name = link.text().trim();
                        
                        if (url.isEmpty() || url.startsWith("javascript:") || name.isEmpty()) {
                            skipped++;
                            continue;
                        }
                        if (repository.existsByUrl(url)) {
                            skipped++;
                            continue;
                        }

                        Bookmark bookmark = new Bookmark();
                        bookmark.setName(name);
                        bookmark.setUrl(url);
                        bookmark.setFolder(currentPath.isEmpty() ? null : currentPath);
                        repository.save(bookmark);
                        imported++;
                    }
                }
            } else if (child.tagName().equals("dl")) {
                counts = parseBookmarkFolder(child, currentPath, new int[]{imported, skipped});
                imported = counts[0];
                skipped = counts[1];
            }
        }
        
        return new int[]{imported, skipped};
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportToChrome() {
        List<Bookmark> bookmarks = repository.findByArchivedFalseOrderByNameAsc();
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE NETSCAPE-Bookmark-file-1>\n");
        html.append("<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n");
        html.append("<TITLE>Bookmarks</TITLE>\n");
        html.append("<H1>Bookmarks</H1>\n");
        html.append("<DL><p>\n");
        
        // Group bookmarks by folder
        java.util.Map<String, java.util.List<Bookmark>> byFolder = bookmarks.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        b -> b.getFolder() == null ? "" : b.getFolder()));
        
        // Write root-level bookmarks first
        if (byFolder.containsKey("")) {
            for (Bookmark b : byFolder.get("")) {
                html.append("    <DT><A HREF=\"").append(escapeHtml(b.getUrl()))
                    .append("\">").append(escapeHtml(b.getName())).append("</A>\n");
            }
        }
        
        // Write folders and their bookmarks
        java.util.Map<String, java.util.List<Bookmark>> folders = byFolder.entrySet().stream()
                .filter(e -> !e.getKey().isEmpty())
                .collect(java.util.stream.Collectors.toMap(
                        java.util.Map.Entry::getKey, 
                        java.util.Map.Entry::getValue));
        
        writeFoldersRecursive(html, folders, "", "    ");
        
        html.append("</DL><p>\n");
        
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"bookmarks.html\"")
                .contentType(org.springframework.http.MediaType.TEXT_HTML)
                .body(html.toString());
    }

    private void writeFoldersRecursive(StringBuilder html, java.util.Map<String, java.util.List<Bookmark>> folders,
                                       String parentPath, String indent) {
        // Get all unique first-level folder names under parentPath
        java.util.Set<String> firstLevel = new java.util.LinkedHashSet<>();
        for (String path : folders.keySet()) {
            if (parentPath.isEmpty()) {
                // Top level
                int slashIdx = path.indexOf('/');
                firstLevel.add(slashIdx == -1 ? path : path.substring(0, slashIdx));
            } else if (path.startsWith(parentPath + "/")) {
                String remainder = path.substring(parentPath.length() + 1);
                int slashIdx = remainder.indexOf('/');
                firstLevel.add(slashIdx == -1 ? remainder : remainder.substring(0, slashIdx));
            }
        }
        
        for (String folderName : firstLevel) {
            String fullPath = parentPath.isEmpty() ? folderName : parentPath + "/" + folderName;
            html.append(indent).append("<DT><H3>").append(escapeHtml(folderName)).append("</H3>\n");
            html.append(indent).append("<DL><p>\n");
            
            // Write bookmarks directly in this folder
            if (folders.containsKey(fullPath)) {
                for (Bookmark b : folders.get(fullPath)) {
                    html.append(indent).append("    <DT><A HREF=\"").append(escapeHtml(b.getUrl()))
                        .append("\">").append(escapeHtml(b.getName())).append("</A>\n");
                }
            }
            
            // Recurse into subfolders
            writeFoldersRecursive(html, folders, fullPath, indent + "    ");
            
            html.append(indent).append("</DL><p>\n");
        }
    }

    private String escapeHtml(String text) {
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }

    private static boolean matchesAllWords(String text, String[] words) {
        String lower = text.toLowerCase();
        for (String word : words) {
            if (!lower.contains(word)) return false;
        }
        return true;
    }

    private void apply(Bookmark bookmark, BookmarkRequest request) {
        bookmark.setName(request.getName().trim());
        bookmark.setUrl(request.getUrl().trim());
        bookmark.setAdditionalInfo(
                request.getAdditionalInfo() == null ? null : request.getAdditionalInfo().trim());
        bookmark.setFolder(
                request.getFolder() == null || request.getFolder().trim().isEmpty() 
                    ? null : request.getFolder().trim());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found");
    }
}
