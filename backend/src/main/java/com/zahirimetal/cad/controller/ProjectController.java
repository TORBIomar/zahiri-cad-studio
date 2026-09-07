package com.zahirimetal.cad.controller;

import com.zahirimetal.cad.dto.TubeProjectDto;
import com.zahirimetal.cad.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * POST /api/v1/projects
     * Save a new CAD Tube Project payload (including all cut operations)
     */
    @PostMapping
    public ResponseEntity<TubeProjectDto> createOrUpdateProject(@RequestBody TubeProjectDto projectDto) {
        TubeProjectDto saved = projectService.saveProject(projectDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /api/v1/projects/{id}
     * Retrieve a specific CAD project layout by UUID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TubeProjectDto> getProjectById(@PathVariable UUID id) {
        TubeProjectDto project = projectService.getProjectById(id);
        return ResponseEntity.ok(project);
    }

    /**
     * GET /api/v1/projects/my
     * List all CAD projects belonging to the authenticated user
     */
    @GetMapping("/my")
    public ResponseEntity<List<TubeProjectDto>> getMyProjects(@org.springframework.security.core.annotation.AuthenticationPrincipal com.zahirimetal.cad.entity.User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<TubeProjectDto> projects = projectService.getProjectsByUser(user.getId());
        return ResponseEntity.ok(projects);
    }

    /**
     * GET /api/v1/projects
     * List all saved CAD projects ordered by creation date
     */
    @GetMapping
    public ResponseEntity<List<TubeProjectDto>> getAllProjects() {
        List<TubeProjectDto> projects = projectService.getAllProjects();
        return ResponseEntity.ok(projects);
    }

    /**
     * DELETE /api/v1/projects/{id}
     * Delete a saved CAD project layout by UUID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}
