package com.office.officemanagement.activity;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/settings/teams")
public class TeamOptionsController {

    private final TeamOptionService service;

    public TeamOptionsController(TeamOptionService service) {
        this.service = service;
    }

    @GetMapping
    public List<TeamOptionView> list() {
        return service.listTeamOptions();
    }

    @PostMapping
    public List<TeamOptionView> add(@RequestBody TeamOptionRequest request) {
        service.addTeam(request.name());
        return service.listTeamOptions();
    }

    @DeleteMapping
    public List<TeamOptionView> remove(@RequestParam String name) {
        service.removeTeam(name);
        return service.listTeamOptions();
    }
}
