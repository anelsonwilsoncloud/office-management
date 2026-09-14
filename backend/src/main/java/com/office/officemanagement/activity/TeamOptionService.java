package com.office.officemanagement.activity;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class TeamOptionService {

    public static final List<String> DEFAULT_TEAMS = List.of("FUX", "TCP", "IRAM", "AI", "OTHER");

    private final JdbcTemplate jdbc;

    public TeamOptionService(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(dataSource);
    }

    public List<TeamOptionView> listTeamOptions() {
        Map<String, Boolean> configured = loadConfiguredTeams();
        Map<String, Integer> inUseCounts = loadInUseCounts();

        LinkedHashSet<String> orderedNames = new LinkedHashSet<>();
        DEFAULT_TEAMS.forEach(orderedNames::add);
        configured.keySet().stream()
                .filter(name -> !DEFAULT_TEAMS.contains(name))
                .sorted()
                .forEach(orderedNames::add);
        inUseCounts.keySet().stream()
                .filter(name -> !orderedNames.contains(name))
                .sorted()
                .forEach(orderedNames::add);

        List<TeamOptionView> result = new ArrayList<>();
        for (String name : orderedNames) {
            boolean isDefault = DEFAULT_TEAMS.contains(name) || Boolean.TRUE.equals(configured.get(name));
            int inUseCount = inUseCounts.getOrDefault(name, 0);
            result.add(new TeamOptionView(name, isDefault, inUseCount, !isDefault && inUseCount == 0));
        }
        return result;
    }

    public void addTeam(String rawName) {
        String name = normalize(rawName);
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team name is required");
        }
        jdbc.update("INSERT OR IGNORE INTO team_options (name, is_default) VALUES (?, 0)", name);
    }

    public void removeTeam(String rawName) {
        String name = normalize(rawName);
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team name is required");
        }
        if (DEFAULT_TEAMS.contains(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Default teams cannot be removed");
        }
        int inUseCount = countInUse(name);
        if (inUseCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team is still used by existing activities");
        }
        jdbc.update("DELETE FROM team_options WHERE name = ?", name);
    }

    public List<String> listTeamNames() {
        return listTeamOptions().stream().map(TeamOptionView::name).toList();
    }

    private Map<String, Boolean> loadConfiguredTeams() {
        return jdbc.query("SELECT name, is_default FROM team_options", rs -> {
            java.util.LinkedHashMap<String, Boolean> result = new java.util.LinkedHashMap<>();
            while (rs.next()) {
                result.put(normalize(rs.getString("name")), rs.getInt("is_default") == 1);
            }
            return result;
        });
    }

    private Map<String, Integer> loadInUseCounts() {
        return jdbc.query("SELECT UPPER(TRIM(team)) AS team_name, COUNT(*) AS count FROM daily_activities " +
                "WHERE team IS NOT NULL AND TRIM(team) <> '' GROUP BY UPPER(TRIM(team))", rs -> {
            java.util.LinkedHashMap<String, Integer> result = new java.util.LinkedHashMap<>();
            while (rs.next()) {
                result.put(normalize(rs.getString("team_name")), rs.getInt("count"));
            }
            return result;
        });
    }

    private int countInUse(String teamName) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM daily_activities WHERE UPPER(TRIM(team)) = ?",
                Integer.class,
                normalize(teamName));
        return count == null ? 0 : count;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }
}
