package com.office.officemanagement.config;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures newly added columns exist on pre-existing SQLite databases.
 *
 * <p>Hibernate's {@code ddl-auto=update} does not reliably add columns to an existing
 * SQLite table (SQLite exposes limited JDBC metadata), so a database created by an
 * earlier version of the app can be missing the {@code archived} column. This runner
 * adds it idempotently on startup, preserving all existing rows.
 */
@Component
public class SqliteSchemaMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SqliteSchemaMigrator.class);

    private final JdbcTemplate jdbc;

    public SqliteSchemaMigrator(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(dataSource);
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureColumn("bookmarks", "archived", "INTEGER NOT NULL DEFAULT 0");
        ensureColumn("bookmarks", "folder", "TEXT");
        ensureColumn("todos", "archived", "INTEGER NOT NULL DEFAULT 0");
        ensureColumn("daily_activities", "archived", "INTEGER NOT NULL DEFAULT 0");
        ensureColumn("daily_activities", "team", "TEXT");
        ensureColumn("daily_activities", "start_date", "TEXT");
        ensureColumn("daily_activities", "end_date", "TEXT");
        ensureColumn("daily_activities", "paused", "INTEGER NOT NULL DEFAULT 0");
        ensureColumn("technical_learning", "archived", "INTEGER NOT NULL DEFAULT 0");
    }

    private void ensureColumn(String table, String column, String columnDefinition) {
        if (!tableExists(table) || columnExists(table, column)) {
            return;
        }
        jdbc.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + columnDefinition);
        log.info("Schema migration: added column '{}' to table '{}'", column, table);
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
                "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = ?",
                Integer.class, table);
        return count != null && count > 0;
    }

    private boolean columnExists(String table, String column) {
        return jdbc.queryForList("PRAGMA table_info(" + table + ")").stream()
                .anyMatch(row -> column.equalsIgnoreCase(String.valueOf(row.get("name"))));
    }
}
