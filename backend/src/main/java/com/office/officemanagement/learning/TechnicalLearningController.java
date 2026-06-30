package com.office.officemanagement.learning;

import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/learning")
public class TechnicalLearningController {

    private final TechnicalLearningRepository repository;

    public TechnicalLearningController(TechnicalLearningRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TechnicalLearning> list(@RequestParam(required = false) String search) {
        List<TechnicalLearning> learnings = repository.findByArchivedFalseOrderByIdDesc();
        if (search != null && !search.trim().isEmpty()) {
            String[] words = search.trim().toLowerCase().split("\\s+");
            return learnings.stream()
                    .filter(l -> {
                        String text = (l.getTopic() + " " +
                                (l.getDescription() != null ? l.getDescription() : ""));
                        return matchesAllWords(text, words);
                    })
                    .toList();
        }
        return learnings;
    }

    @GetMapping("/archived")
    public List<TechnicalLearning> listArchived() {
        return repository.findByArchivedTrueOrderByIdDesc();
    }

    @PostMapping
    public TechnicalLearning create(@Valid @RequestBody TechnicalLearningRequest request) {
        TechnicalLearning learning = new TechnicalLearning();
        apply(learning, request);
        learning.setArchived(false);
        return repository.save(learning);
    }

    @PutMapping("/{id}")
    public TechnicalLearning update(@PathVariable Long id, @Valid @RequestBody TechnicalLearningRequest request) {
        TechnicalLearning learning = repository.findById(id).orElseThrow(this::notFound);
        apply(learning, request);
        return repository.save(learning);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        TechnicalLearning learning = repository.findById(id).orElseThrow(this::notFound);
        learning.setArchived(true);
        repository.save(learning);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public TechnicalLearning restore(@PathVariable Long id) {
        TechnicalLearning learning = repository.findById(id).orElseThrow(this::notFound);
        learning.setArchived(false);
        return repository.save(learning);
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<Void> deletePermanently(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw notFound();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private static boolean matchesAllWords(String text, String[] words) {
        String lower = text.toLowerCase();
        for (String word : words) {
            if (!lower.contains(word)) return false;
        }
        return true;
    }

    private void apply(TechnicalLearning learning, TechnicalLearningRequest request) {
        learning.setTopic(request.getTopic().trim());
        learning.setPriority(request.getPriority());
        learning.setDescription(
                request.getDescription() == null || request.getDescription().trim().isEmpty()
                        ? null : request.getDescription().trim());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Learning topic not found");
    }
}
