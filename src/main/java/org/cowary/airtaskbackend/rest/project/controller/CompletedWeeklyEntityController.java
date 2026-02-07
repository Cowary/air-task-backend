package org.cowary.airtaskbackend.rest.project.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.rest.planka.controller.dto.ApiResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.CompletedWeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.project.controller.dto.CompletedWeeklyResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.WeeklyTaskStatisticsResponse;
import org.cowary.airtaskbackend.service.CompletedWeeklyEntityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/completed-weekly/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Completed Weekly Task Management", description = "API для управления завершенными недельными задачами")
public class CompletedWeeklyEntityController {

    private final CompletedWeeklyEntityService completedWeeklyService;

    @GetMapping("/list")
    @Operation(summary = "Получить список всех завершенных недельных задач",
               description = "Возвращает список всех завершенных недельных задач в системе")
    public ResponseEntity<ApiResponse<List<CompletedWeeklyResponse>>> getAllCompletedWeeklyTasks() {
        try {
            List<CompletedWeeklyResponse> completedWeeklyTasks = completedWeeklyService.getAllCompletedWeeklyTasks();
            return ResponseEntity.ok(new ApiResponse<>(true, null, null, completedWeeklyTasks));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }

    @GetMapping("/weekly/{weeklyId}")
    @Operation(summary = "Получить завершенные задачи по weekly entity ID",
               description = "Возвращает список завершенных задач для указанной weekly entity")
    public ResponseEntity<ApiResponse<List<CompletedWeeklyResponse>>> getCompletedWeeklyTasksByWeeklyId(@PathVariable Long weeklyId) {
        try {
            List<CompletedWeeklyResponse> completedWeeklyTasks = completedWeeklyService.getCompletedWeeklyTasksByWeeklyId(weeklyId);
            return ResponseEntity.ok(new ApiResponse<>(true, null, null, completedWeeklyTasks));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить завершенную задачу по ID",
               description = "Возвращает завершенную задачу с указанным ID")
    public ResponseEntity<ApiResponse<CompletedWeeklyResponse>> getCompletedWeeklyTaskById(@PathVariable Long id) {
        try {
            CompletedWeeklyResponse completedWeekly = completedWeeklyService.getCompletedWeeklyTaskById(id);
            return ResponseEntity.ok(new ApiResponse<>(true, null, null, completedWeekly));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage(), null, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }

    @GetMapping("/statistics/current-week")
    @Operation(summary = "Получить статистику выполнения недельных задач за текущую неделю",
               description = "Возвращает два списка: завершенных и не завершенных задач на текущей неделе с учетом требуемого количества")
    public ResponseEntity<ApiResponse<WeeklyTaskStatisticsResponse>> getWeeklyTaskStatistics() {
        try {
            log.info("Getting weekly task statistics for current week");
            WeeklyTaskStatisticsResponse statistics = completedWeeklyService.getWeeklyTaskStatistics();
            return ResponseEntity.ok(new ApiResponse<>(true, null, null, statistics));
        } catch (Exception e) {
            log.error("Error getting weekly task statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }

    @PostMapping
    @Operation(summary = "Создать завершенную задачу",
               description = "Создает новую запись о завершенной недельной задаче")
    public ResponseEntity<ApiResponse<CompletedWeeklyResponse>> createCompletedWeeklyTask(@RequestBody CompletedWeeklyCreateRequest request) {
        try {
            CompletedWeeklyResponse completedWeekly = completedWeeklyService.createCompletedWeeklyTask(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, null, null, completedWeekly));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage(), null, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Удалить завершенную задачу",
               description = "Удаляет запись о завершенной задаче с указанным ID")
    public ResponseEntity<ApiResponse<Void>> deleteCompletedWeeklyTask(@PathVariable Long id) {
        try {
            completedWeeklyService.deleteCompletedWeeklyTask(id);
            return ResponseEntity.ok(new ApiResponse<>(true, null, null, null));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage(), null, null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Internal server error: " + e.getMessage(), null, null));
        }
    }
}