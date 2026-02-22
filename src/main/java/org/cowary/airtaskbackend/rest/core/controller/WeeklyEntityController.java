package org.cowary.airtaskbackend.rest.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.rest.common.ApiResponse;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyResponse;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyUpdateRequest;
import org.cowary.airtaskbackend.service.weekly.WeeklyEntityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@RestController
@RequestMapping("/api/weekly/v1")
@RequiredArgsConstructor
@Tag(name = "Weekly Task Management", description = "API для управления недельными задачами")
public class WeeklyEntityController {

    private final WeeklyEntityService weeklyService;

    @GetMapping("/list")
    @Operation(summary = "Получить список всех недельных задач", description = "Возвращает список всех недельных задач в системе")
    public ResponseEntity<ApiResponse<List<WeeklyResponse>>> getAllWeeklyTasks() {
        log.info("Request to get all weekly tasks");
        try {
            List<WeeklyResponse> weeklyTasks = weeklyService.getAllWeeklyTasks();
            return ResponseEntity.ok(ApiResponse.<List<WeeklyResponse>>builder()
                    .isSuccess(true)
                    .data(weeklyTasks)
                    .build());
        } catch (Exception e) {
            log.error("Error getting all weekly tasks", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WeeklyResponse>>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Получить недельные задачи по проекту", description = "Возвращает список недельных задач для указанного проекта")
    public ResponseEntity<ApiResponse<List<WeeklyResponse>>> getWeeklyTasksByProject(@PathVariable Long projectId) {
        log.info("Request to get weekly tasks for project: {}", projectId);
        try {
            List<WeeklyResponse> weeklyTasks = weeklyService.getWeeklyTasksByProjectId(projectId);
            return ResponseEntity.ok(ApiResponse.<List<WeeklyResponse>>builder()
                    .isSuccess(true)
                    .data(weeklyTasks)
                    .build());
        } catch (Exception e) {
            log.error("Error getting weekly tasks for project: {}", projectId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WeeklyResponse>>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/project/{projectId}/status/{status}")
    @Operation(summary = "Получить недельные задачи по проекту и статусу",
               description = "Возвращает список недельных задач для указанного проекта с определенным статусом")
    public ResponseEntity<ApiResponse<List<WeeklyResponse>>> getWeeklyTasksByProjectAndStatus(
            @PathVariable Long projectId, @PathVariable String status) {
        log.info("Request to get weekly tasks for project: {} with status: {}", projectId, status);
        try {
            List<WeeklyResponse> weeklyTasks = weeklyService.getWeeklyTasksByProjectIdAndStatus(projectId, status);
            return ResponseEntity.ok(ApiResponse.<List<WeeklyResponse>>builder()
                    .isSuccess(true)
                    .data(weeklyTasks)
                    .build());
        } catch (Exception e) {
            log.error("Error getting weekly tasks for project: {} with status: {}", projectId, status, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<List<WeeklyResponse>>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить недельную задачу по ID", description = "Возвращает недельную задачу с указанным ID")
    public ResponseEntity<ApiResponse<WeeklyResponse>> getWeeklyTaskById(@PathVariable Long id) {
        log.info("Request to get weekly task with id: {}", id);
        try {
            WeeklyResponse weekly = weeklyService.getWeeklyTaskById(id);
            return ResponseEntity.ok(ApiResponse.<WeeklyResponse>builder()
                    .isSuccess(true)
                    .data(weekly)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Weekly task not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error getting weekly task with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping
    @Operation(summary = "Создать новую недельную задачу", description = "Создает новую недельную задачу в системе")
    public ResponseEntity<ApiResponse<WeeklyResponse>> createWeeklyTask(@RequestBody WeeklyCreateRequest request) {
        log.info("Request to create weekly task with name: {}", request.getName());
        try {
            WeeklyResponse weekly = weeklyService.createWeeklyTask(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(true)
                            .data(weekly)
                            .build());
        } catch (NoSuchElementException e) {
            log.warn("Project not found with id: {}", request.getProjectId());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error creating weekly task", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Обновить недельную задачу", description = "Обновляет информацию о недельной задаче с указанным ID")
    public ResponseEntity<ApiResponse<WeeklyResponse>> updateWeeklyTask(@PathVariable Long id,
                                                                       @RequestBody WeeklyUpdateRequest request) {
        log.info("Request to update weekly task with id: {}", id);
        try {
            WeeklyResponse weekly = weeklyService.updateWeeklyTask(id, request);
            return ResponseEntity.ok(ApiResponse.<WeeklyResponse>builder()
                    .isSuccess(true)
                    .data(weekly)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Weekly task not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error updating weekly task with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<WeeklyResponse>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить недельную задачу", description = "Удаляет недельную задачу с указанным ID")
    public ResponseEntity<ApiResponse<Void>> deleteWeeklyTask(@PathVariable Long id) {
        log.info("Request to delete weekly task with id: {}", id);
        try {
            weeklyService.deleteWeeklyTask(id);
            return ResponseEntity.ok(ApiResponse.<Void>builder()
                    .isSuccess(true)
                    .build());
        } catch (NoSuchElementException e) {
            log.warn("Weekly task not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.<Void>builder()
                            .isSuccess(false)
                            .errorMessage(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("Error deleting weekly task with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<Void>builder()
                            .isSuccess(false)
                            .errorMessage("Internal server error: " + e.getMessage())
                            .build());
        }
    }
}