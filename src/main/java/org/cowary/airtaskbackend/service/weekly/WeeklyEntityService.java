package org.cowary.airtaskbackend.service.weekly;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.cowary.airtaskbackend.db.repository.ProjectRepository;
import org.cowary.airtaskbackend.db.repository.WeeklyRepository;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyResponse;
import org.cowary.airtaskbackend.rest.core.dto.WeeklyUpdateRequest;
import org.cowary.airtaskbackend.rest.core.mapper.WeeklyMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeeklyEntityService {

    private final WeeklyRepository weeklyRepository;
    private final ProjectRepository projectRepository;
    private final WeeklyMapper weeklyMapper;

    @Transactional(readOnly = true)
    public List<WeeklyResponse> getAllWeeklyTasks() {
        log.debug("Getting all weekly tasks");
        return weeklyRepository.findAll().stream()
                .map(weeklyMapper::toResponseWithProject)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WeeklyResponse> getWeeklyTasksByProjectId(Long projectId) {
        log.debug("Getting weekly tasks for project: {}", projectId);
        return weeklyRepository.findByProjectId(projectId).stream()
                .map(weeklyMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WeeklyResponse getWeeklyTaskById(Long id) {
        log.debug("Getting weekly task by id: {}", id);
        WeeklyEntity weekly = weeklyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Weekly task not found with id: " + id));
        return weeklyMapper.toResponse(weekly);
    }

    @Transactional
    public WeeklyResponse createWeeklyTask(WeeklyCreateRequest request) {
        log.debug("Creating weekly task with name: {}", request.getName());

        // Validate project exists
        ProjectEntity project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + request.getProjectId()));

        WeeklyEntity weekly = weeklyMapper.toEntity(request);
        weekly.setProject(project);

        WeeklyEntity savedWeekly = weeklyRepository.save(weekly);
        return weeklyMapper.toResponseWithProject(savedWeekly);
    }

    @Transactional
    public WeeklyResponse updateWeeklyTask(Long id, WeeklyUpdateRequest request) {
        log.debug("Updating weekly task with id: {}", id);
        WeeklyEntity weekly = weeklyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Weekly task not found with id: " + id));

        weeklyMapper.updateFromRequest(request, weekly);
        WeeklyEntity updatedWeekly = weeklyRepository.save(weekly);
        return weeklyMapper.toResponse(updatedWeekly);
    }

    @Transactional
    public void deleteWeeklyTask(Long id) {
        log.debug("Deleting weekly task with id: {}", id);
        if (!weeklyRepository.existsById(id)) {
            throw new NoSuchElementException("Weekly task not found with id: " + id);
        }
        weeklyRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<WeeklyResponse> getWeeklyTasksByProjectIdAndStatus(Long projectId, String status) {
        log.debug("Getting weekly tasks for project: {} with status: {}", projectId, status);
        return weeklyRepository.findByProjectIdAndStatus(projectId, status).stream()
                .map(weeklyMapper::toResponseWithProject)
                .toList();
    }
}