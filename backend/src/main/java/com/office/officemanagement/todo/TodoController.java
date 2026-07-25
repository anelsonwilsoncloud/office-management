package com.office.officemanagement.todo;

import jakarta.validation.Valid;
import java.time.LocalDate;
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
@RequestMapping("/api/todos")
public class TodoController {

    /** Number of upcoming days included in the "future pending" grid. */
    private static final int FUTURE_WINDOW_DAYS = 5;

    private final TodoRepository repository;

    public TodoController(TodoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Todo> list(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "accomplished", required = false) Boolean accomplished,
            @RequestParam(name = "fromDate", required = false) String fromDate,
            @RequestParam(name = "toDate", required = false) String toDate) {
        LocalDate from = (fromDate != null && !fromDate.isBlank()) ? LocalDate.parse(fromDate) : null;
        LocalDate to = (toDate != null && !toDate.isBlank()) ? LocalDate.parse(toDate) : null;
        List<Todo> all = repository.searchActive(null, accomplished, from, to);
        if (search == null || search.isBlank()) {
            return all;
        }
        String[] words = search.trim().toLowerCase().split("\\s+");
        return all.stream()
                .filter(t -> matchesAllWords(
                        t.getName() + " " + (t.getDescription() == null ? "" : t.getDescription()),
                        words))
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/archived")
    public List<Todo> archived() {
        return repository.findByArchivedTrueOrderByDateDesc();
    }

    @GetMapping("/past-pending")
    public List<Todo> pastPending() {
        return repository.findByArchivedFalseAndAccomplishedFalseAndDateBeforeOrderByDateDesc(
                LocalDate.now());
    }

    @GetMapping("/future-pending")
    public List<Todo> futurePending() {
        LocalDate today = LocalDate.now();
        return repository
                .findByArchivedFalseAndAccomplishedFalseAndDateAfterAndDateLessThanEqualOrderByDateAsc(
                        today, today.plusDays(FUTURE_WINDOW_DAYS));
    }

    @GetMapping("/{id}")
    public Todo get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(this::notFound);
    }

    @PostMapping
    public ResponseEntity<Todo> create(@Valid @RequestBody TodoRequest request) {
        Todo todo = new Todo();
        apply(todo, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(todo));
    }

    @PutMapping("/{id}")
    public Todo update(@PathVariable Long id, @Valid @RequestBody TodoRequest request) {
        Todo todo = repository.findById(id).orElseThrow(this::notFound);
        apply(todo, request);
        return repository.save(todo);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        Todo todo = repository.findById(id).orElseThrow(this::notFound);
        todo.setArchived(true);
        repository.save(todo);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public Todo restore(@PathVariable Long id) {
        Todo todo = repository.findById(id).orElseThrow(this::notFound);
        todo.setArchived(false);
        return repository.save(todo);
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

    private void apply(Todo todo, TodoRequest request) {
        todo.setName(request.getName().trim());
        todo.setDate(request.getDate());
        todo.setPriority(request.getPriority());
        todo.setDescription(
                request.getDescription() == null ? null : request.getDescription().trim());
        todo.setAccomplished(request.isAccomplished());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found");
    }
}
