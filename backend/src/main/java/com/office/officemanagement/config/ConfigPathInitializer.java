package com.office.officemanagement.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Runs before the Spring datasource is initialized.
 * If the user previously saved a custom DB path via the setup dialog,
 * that path is read from ~/.office-management/.db-path and injected as
 * the OFFICE_DB_PATH system property so application.properties picks it up.
 */
public class ConfigPathInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(ConfigPathInitializer.class);

    public static final Path CONFIG_DIR = Path.of(System.getProperty("user.home"), ".office-management");
    public static final Path DB_PATH_FILE = CONFIG_DIR.resolve(".db-path");

    @Override
    public void initialize(ConfigurableApplicationContext ctx) {
        // Always ensure the config/data directory exists before Spring touches the datasource
        try {
            Files.createDirectories(CONFIG_DIR);
        } catch (IOException e) {
            log.warn("Could not create config directory {}: {}", CONFIG_DIR, e.getMessage());
        }

        if (Files.exists(DB_PATH_FILE)) {
            try {
                String dbPath = Files.readString(DB_PATH_FILE).trim();
                if (!dbPath.isEmpty()) {
                    // Also ensure the parent directory of a custom DB path exists
                    try {
                        Files.createDirectories(Path.of(dbPath).getParent());
                    } catch (Exception ignored) {}
                    System.setProperty("OFFICE_DB_PATH", dbPath);
                    log.info("Using configured database path: {}", dbPath);
                }
            } catch (IOException e) {
                log.warn("Could not read DB path config file: {}", e.getMessage());
            }
        } else {
            // No custom path configured — ensure the default DB directory exists
            try {
                Files.createDirectories(CONFIG_DIR);
            } catch (IOException e) {
                log.warn("Could not create default DB directory: {}", e.getMessage());
            }
        }
    }
}
