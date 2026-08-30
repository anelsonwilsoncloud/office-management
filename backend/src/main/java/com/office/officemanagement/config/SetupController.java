package com.office.officemanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api/setup")
public class SetupController {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    /** Checks whether a given file path points to an existing file. */
    @GetMapping("/check-path")
    public Map<String, Object> checkPath(@RequestParam String path) {
        boolean exists = path != null && !path.isBlank() && java.nio.file.Files.exists(java.nio.file.Path.of(path.trim()));
        return Map.of("exists", exists);
    }

    /** Returns whether this is a first-run and what DB path is currently active. */
    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        boolean firstRun = !Files.exists(ConfigPathInitializer.DB_PATH_FILE);
        return Map.of(
                "firstRun", firstRun,
                "dbPath", extractDbPath(datasourceUrl)
        );
    }

    /** Saves the chosen DB path and marks setup as complete. */
    @PostMapping("/complete")
    public Map<String, Object> complete(@RequestBody Map<String, String> body) throws IOException {
        String requestedPath = body.getOrDefault("dbPath", "").trim();
        String currentPath = extractDbPath(datasourceUrl);

        Files.createDirectories(ConfigPathInitializer.CONFIG_DIR);
        Files.writeString(ConfigPathInitializer.DB_PATH_FILE, requestedPath);

        boolean requiresRestart = !requestedPath.equals(currentPath);
        return Map.of("success", true, "requiresRestart", requiresRestart);
    }

    private String extractDbPath(String jdbcUrl) {
        return jdbcUrl.replace("jdbc:sqlite:", "");
    }
}
