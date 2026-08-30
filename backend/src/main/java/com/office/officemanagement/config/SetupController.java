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

    /** Returns environment capabilities so the UI can show/hide features like Browse. */
    @GetMapping("/capabilities")
    public Map<String, Object> capabilities() {
        boolean isDesktop = "desktop".equals(System.getProperty("office.mode"));
        return Map.of("fileBrowser", isDesktop);
    }

    /** Opens a native OS file chooser and returns the selected path. Only works in non-headless environments. */
    @GetMapping("/browse")
    public Map<String, Object> browse() {
        if (!"desktop".equals(System.getProperty("office.mode"))) {
            return Map.of("success", false, "reason", "headless");
        }
        try {
            String[] result = new String[1];
            java.util.concurrent.CountDownLatch latch = new java.util.concurrent.CountDownLatch(1);

            java.awt.EventQueue.invokeLater(() -> {
                try {
                    javax.swing.UIManager.setLookAndFeel(javax.swing.UIManager.getSystemLookAndFeelClassName());
                } catch (Exception ignored) {}

                javax.swing.JFileChooser chooser = new javax.swing.JFileChooser();
                chooser.setDialogTitle("Select or create database file");
                chooser.setFileSelectionMode(javax.swing.JFileChooser.FILES_ONLY);
                chooser.setFileFilter(new javax.swing.filechooser.FileNameExtensionFilter("SQLite Database (*.db)", "db"));

                // Pre-select current path if exists
                String current = System.getProperty("OFFICE_DB_PATH");
                if (current != null && !current.isBlank()) {
                    java.io.File f = new java.io.File(current);
                    chooser.setCurrentDirectory(f.getParentFile());
                    chooser.setSelectedFile(f);
                } else {
                    chooser.setCurrentDirectory(ConfigPathInitializer.CONFIG_DIR.toFile());
                    chooser.setSelectedFile(new java.io.File(ConfigPathInitializer.CONFIG_DIR.toFile(), "office.db"));
                }

                // Create a tiny invisible-but-visible frame so the dialog gets a proper parent
                // and always appears on top of the browser window
                javax.swing.JFrame frame = new javax.swing.JFrame();
                frame.setUndecorated(true);
                frame.setSize(1, 1);
                frame.setLocationRelativeTo(null);
                frame.setAlwaysOnTop(true);
                frame.setVisible(true);
                frame.toFront();
                frame.requestFocus();

                int returnVal = chooser.showSaveDialog(frame);
                frame.dispose();

                if (returnVal == javax.swing.JFileChooser.APPROVE_OPTION) {
                    String path = chooser.getSelectedFile().getAbsolutePath();
                    if (!path.endsWith(".db")) path += ".db";
                    result[0] = path;
                }
                latch.countDown();
            });

            latch.await(15, java.util.concurrent.TimeUnit.SECONDS);
            if (result[0] != null) {
                return Map.of("success", true, "path", result[0]);
            }
            return Map.of("success", false, "reason", "cancelled");
        } catch (Exception e) {
            return Map.of("success", false, "reason", e.getMessage());
        }
    }

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
        boolean isDesktop = "desktop".equals(System.getProperty("office.mode"));
        return Map.of(
                "firstRun", firstRun,
                "dbPath", extractDbPath(datasourceUrl),
                "fileBrowser", isDesktop
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
