package org.cowary.airtaskbackend.rest.project.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.rest.planka.controller.dto.ApiResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.ProjectCreateRequest;
import org.cowary.airtaskbackend.rest.project.controller.dto.ProjectListResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.ProjectResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.ProjectUpdateRequest;
import org.cowary.airtaskbackend.service.ProjectEntityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@RestController
@RequestMapping("/api/project/v1")
@RequiredArgsConstructor
@Tag(name = "Project Management", description = "API для управления проектами")
public class ProjectEntityController {

    private final ProjectEntityService projectService;

    @GetMapping("/list")
    @Operation(summary = "Получить список всех проектов", description = "Возвращает список всех проектов в системе")
    public ResponseEntity<ApiResponse<ProjectListResponse>> getAllProjects() {
        log.info("Request to get all projects");
        try {
            List<ProjectResponse> projects = projectService.getAllProjects();
            ProjectListResponse response = ProjectListResponse.builder()
                    .projects(projects)
                    .build();

            return ResponseEntity.ok(ApiResponse.<ProjectListResponse>builder()
                    .isSuccess(true)
                    .data(response)
                    .build());
        } catch (Exception e) {
            log.error("Error getting all projects", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProjectListResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/list-with-weekly")
    @Operation(summary = "Получить список проектов с недельными задачами", description = "Возвращает список всех проектов с их недельными задачами")
    public ResponseEntity<ApiResponse<ProjectListResponse>> getProjectsWithWeeklyTasks() {
        log.info("Request to get projects with weekly tasks");
        try {
            List<ProjectResponse> projects = projectService.getProjectsWithWeeklyTasks();
            ProjectListResponse response = ProjectListResponse.builder()
                    .projects(projects)
                    .build();

            return ResponseEntity.ok(ApiResponse.<ProjectListResponse>builder()
                    .isSuccess(true)
                    .data(response)
                    .build());
        } catch (Exception e) {
            log.error("Error getting projects with weekly tasks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProjectListResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить проект по ID", description = "Возвращает проект с указанным ID")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(@PathVariable Long id) {
        log.info("Request to get project with id: {}", id);
        try {
            ProjectResponse project = projectService.getProjectById(id);
            return ResponseEntity.ok(ApiResponse.<ProjectResponse>builder()
                    .isSuccess(true)
                    .data(project)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Project not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error getting project with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping
    @Operation(summary = "Создать новый проект", description = "Создает новый проект в системе")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@RequestBody ProjectCreateRequest request) {
        log.info("Request to create project with name: {}", request.getName());
        try {
            ProjectResponse project = projectService.createProject(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(true)
                            .data(project)
                            .build());
        } catch (Exception e) {
            log.error("Error creating project", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить проект", description = "Обновляет информацию о проекте с указанным ID")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(@PathVariable Long id,
                                                                     @RequestBody ProjectUpdateRequest request) {
        log.info("Request to update project with id: {}", id);
        try {
            ProjectResponse project = projectService.updateProject(id, request);
            return ResponseEntity.ok(ApiResponse.<ProjectResponse>builder()
                    .isSuccess(true)
                    .data(project)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Project not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error updating project with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<ProjectResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @DeleteMapping("/{id}")
//    @Operation(summary = "Удалить проект", description = "Удаляет проект с указанным ID")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        log.info("Request to delete project with id: {}", id);
        try {
            projectService.deleteProject(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .isSuccess(true)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Project not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error deleting project with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }
}