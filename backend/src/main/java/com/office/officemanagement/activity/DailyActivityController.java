package com.office.officemanagement.activity;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
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
@RequestMapping("/api/activities")
public class DailyActivityController {

    private final DailyActivityRepository repository;

    public DailyActivityController(DailyActivityRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DailyActivity> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String team,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        List<DailyActivity> activities = repository.findByArchivedFalseOrderByIdDesc();

        if (search != null && !search.trim().isEmpty()) {
            String[] words = search.trim().toLowerCase().split("\\s+");
            activities = activities.stream()
                    .filter(a -> {
                        String text = (a.getActivityName() + " " +
                                (a.getStoryNumber() != null ? a.getStoryNumber() : "") + " " +
                                (a.getTeam() != null ? a.getTeam() : "") + " " +
                                (a.getDescription() != null ? a.getDescription() : ""));
                        return matchesAllWords(text, words);
                    })
                    .collect(Collectors.toList());
        }

        if (team != null && !team.trim().isEmpty()) {
            final String t = team.trim().toUpperCase();
            activities = activities.stream()
                    .filter(a -> t.equals(a.getTeam()))
                    .collect(Collectors.toList());
        }

        if (fromDate != null && !fromDate.isBlank()) {
            LocalDate from = LocalDate.parse(fromDate);
            activities = activities.stream()
                    .filter(a -> a.getStartDate() != null && !a.getStartDate().isBefore(from))
                    .collect(Collectors.toList());
        }

        if (toDate != null && !toDate.isBlank()) {
            LocalDate to = LocalDate.parse(toDate);
            activities = activities.stream()
                    .filter(a -> a.getStartDate() != null && !a.getStartDate().isAfter(to))
                    .collect(Collectors.toList());
        }

        return activities;
    }

    @GetMapping("/archived")
    public List<DailyActivity> listArchived() {
        return repository.findByArchivedTrueOrderByIdDesc();
    }

    @PostMapping
    public DailyActivity create(@Valid @RequestBody DailyActivityRequest request) {
        DailyActivity activity = new DailyActivity();
        apply(activity, request);
        activity.setArchived(false);
        return repository.save(activity);
    }

    @PutMapping("/{id}")
    public DailyActivity update(@PathVariable Long id, @Valid @RequestBody DailyActivityRequest request) {
        DailyActivity activity = repository.findById(id).orElseThrow(this::notFound);
        apply(activity, request);
        return repository.save(activity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archive(@PathVariable Long id) {
        DailyActivity activity = repository.findById(id).orElseThrow(this::notFound);
        activity.setArchived(true);
        repository.save(activity);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/restore")
    public DailyActivity restore(@PathVariable Long id) {
        DailyActivity activity = repository.findById(id).orElseThrow(this::notFound);
        activity.setArchived(false);
        return repository.save(activity);
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

    private void apply(DailyActivity activity, DailyActivityRequest request) {
        activity.setActivityName(request.getActivityName().trim());
        activity.setStoryNumber(
                request.getStoryNumber() == null || request.getStoryNumber().trim().isEmpty()
                        ? null : request.getStoryNumber().trim());
        activity.setTeam(
                request.getTeam() == null || request.getTeam().trim().isEmpty()
                        ? null : request.getTeam().trim().toUpperCase());
        activity.setStartDate(request.getStartDate());
        activity.setEndDate(request.getEndDate());
        activity.setHoursSpend(request.getHoursSpend());
        activity.setHighlight(request.getHighlight() != null && request.getHighlight());
        activity.setHighlighted(request.getHighlighted() != null && request.getHighlighted());
        activity.setPaused(request.getPaused() != null && request.getPaused());
        activity.setDescription(
                request.getDescription() == null || request.getDescription().trim().isEmpty()
                        ? null : request.getDescription().trim());
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found");
    }
}
