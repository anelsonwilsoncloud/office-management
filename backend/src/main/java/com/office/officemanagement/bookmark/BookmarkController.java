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
                        b.getName() + " " + (b.getAdditionalInfo() == null ? "" : b.getAdditionalInfo()),
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

        Elements links = doc.select("a[href]");
        int imported = 0;
        int skipped = 0;

        for (Element link : links) {
            String url = link.attr("href").trim();
            String name = link.text().trim();

            // skip javascript: pseudo-URLs and blank entries
            if (url.isEmpty() || url.startsWith("javascript:") || name.isEmpty()) {
                skipped++;
                continue;
            }
            // skip duplicates already in the DB
            if (repository.existsByUrl(url)) {
                skipped++;
                continue;
            }

            Bookmark bookmark = new Bookmark();
            bookmark.setName(name);
            bookmark.setUrl(url);
            repository.save(bookmark);
            imported++;
        }

        return new BookmarkImportResult(imported, skipped);
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
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found");
    }
}
