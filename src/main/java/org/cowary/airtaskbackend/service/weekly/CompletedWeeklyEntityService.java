package org.cowary.airtaskbackend.service.weekly;

import lombok.RequiredArgsConstructor;
import org.cowary.airtaskbackend.db.entity.CompletedWeeklyEntity;
import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.cowary.airtaskbackend.db.repository.CompletedWeeklyRepository;
import org.cowary.airtaskbackend.db.repository.WeeklyRepository;
import org.cowary.airtaskbackend.rest.core.dto.CompletedWeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.CompletedWeeklyResponse;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyTaskStatisticsResponse;
import org.cowary.airtaskbackend.rest.core.mapper.CompletedWeeklyMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompletedWeeklyEntityService {

    private final CompletedWeeklyRepository completedWeeklyRepository;
    private final WeeklyRepository weeklyRepository;
    private final CompletedWeeklyMapper completedWeeklyMapper;

    @Transactional(readOnly = true)
    public List<CompletedWeeklyResponse> getAllCompletedWeeklyTasks() {
        return completedWeeklyRepository.findAll().stream()
                .map(completedWeeklyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CompletedWeeklyResponse> getCompletedWeeklyTasksByWeeklyId(Long weeklyId) {
        return completedWeeklyRepository.findByWeeklyEntityId(weeklyId).stream()
                .map(completedWeeklyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CompletedWeeklyResponse getCompletedWeeklyTaskById(Long id) {
        CompletedWeeklyEntity completedWeekly = completedWeeklyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Completed weekly task not found with id: " + id));
        return completedWeeklyMapper.toResponse(completedWeekly);
    }

    @Transactional
    public CompletedWeeklyResponse createCompletedWeeklyTask(CompletedWeeklyCreateRequest request) {
        // Validate weekly entity exists
        WeeklyEntity weeklyEntity = weeklyRepository.findById(request.getWeeklyEntityId())
                .orElseThrow(() -> new NoSuchElementException("Weekly entity not found with id: " + request.getWeeklyEntityId()));

        CompletedWeeklyEntity completedWeekly = completedWeeklyMapper.toEntity(request, weeklyEntity);
        CompletedWeeklyEntity savedCompletedWeekly = completedWeeklyRepository.save(completedWeekly);

        return completedWeeklyMapper.toResponse(savedCompletedWeekly);
    }

    @Transactional
    public void deleteCompletedWeeklyTask(Long id) {
        if (!completedWeeklyRepository.existsById(id)) {
            throw new NoSuchElementException("Completed weekly task not found with id: " + id);
        }
        completedWeeklyRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public WeeklyTaskStatisticsResponse getWeeklyTaskStatistics() {
        // Get current week boundaries (Monday 00:00 to Sunday 23:59:59)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfWeek = now.with(DayOfWeek.MONDAY).with(LocalTime.MIN);
        LocalDateTime endOfWeek = now.with(DayOfWeek.SUNDAY).with(LocalTime.MAX);

        // Get all weekly tasks
        List<WeeklyEntity> allWeeklyTasks = weeklyRepository.findAll();

        // Get completed tasks for current week
        List<CompletedWeeklyEntity> completedThisWeek = completedWeeklyRepository
                .findCompletedThisWeek(startOfWeek, endOfWeek);

        // Group completed tasks by weekly task ID
        var completedByWeeklyId = completedThisWeek.stream()
                .collect(Collectors.groupingBy(c -> c.getWeeklyEntity().getId(), Collectors.counting()));
        Map<WeeklyEntity, List<CompletedWeeklyEntity>> completedByWeekly = completedThisWeek.stream()
                .collect(Collectors.groupingBy(CompletedWeeklyEntity::getWeeklyEntity));

        // Separate completed and incomplete tasks
        var completedTasks = allWeeklyTasks.stream()
                .filter(weekly -> {
                    Long completedCount = completedByWeeklyId.getOrDefault(weekly.getId(), 0L);
                    return completedCount >= weekly.getCount();
                })
                .map(weekly -> {
                    Long completedCount = completedByWeeklyId.getOrDefault(weekly.getId(), 0L);
                    return WeeklyTaskStatisticsResponse.WeeklyWithCompletionStatus.builder()
                            .weeklyTaskId(weekly.getId())
                            .weeklyTaskName(weekly.getName())
                            .requiredCount(weekly.getCount())
                            .completedCount(completedCount.intValue())
                            .remainingCount(0)
                            .completionPercentage("100%")
                            .projectId(weekly.getProject().getId())
                            .projectName(weekly.getProject().getName())
                            .build();
                })
                .collect(Collectors.toList());

        var incompleteTasks = allWeeklyTasks.stream()
                .filter(weekly -> {
                    Long completedCount = completedByWeeklyId.getOrDefault(weekly.getId(), 0L);
                    return completedCount < weekly.getCount();
                })
                .map(weekly -> {
                    Long completedCount = completedByWeeklyId.getOrDefault(weekly.getId(), 0L);
                    int remaining = weekly.getCount() - completedCount.intValue();
                    double percentage = weekly.getCount() > 0 ? (completedCount.doubleValue() / weekly.getCount()) * 100 : 0;
                    boolean isCompletedToday = completedByWeekly.getOrDefault(weekly, Collections.emptyList()).stream()
                            .anyMatch(c -> c.getCompletedDate()
                                    .isBefore(LocalDate.now().atStartOfDay().plusHours(27)) && c.getCompletedDate()
                                    .isAfter(LocalDate.now().atStartOfDay().minusHours(3)));

                    return WeeklyTaskStatisticsResponse.WeeklyWithCompletionStatus.builder()
                            .weeklyTaskId(weekly.getId())
                            .weeklyTaskName(weekly.getName())
                            .requiredCount(weekly.getCount())
                            .completedCount(completedCount.intValue())
                            .remainingCount(remaining)
                            .completionPercentage(String.format("%.1f%%", percentage))
                            .projectId(weekly.getProject().getId())
                            .projectName(weekly.getProject().getName())
                            .completedToday(isCompletedToday)
                            .build();
                })
                .collect(Collectors.toList());

        return WeeklyTaskStatisticsResponse.builder()
                .completedTasks(completedTasks)
                .incompleteTasks(incompleteTasks)
                .build();
    }
}