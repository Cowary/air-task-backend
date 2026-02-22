package org.cowary.airtaskbackend.service.db;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.cowary.airtaskbackend.db.repository.ProjectRepository;
import org.cowary.airtaskbackend.rest.core.dto.ProjectCreateRequest;
import org.cowary.airtaskbackend.rest.core.dto.ProjectResponse;
import org.cowary.airtaskbackend.rest.core.dto.ProjectUpdateRequest;
import org.cowary.airtaskbackend.rest.core.mapper.ProjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectEntityService {

    private final ProjectRepository projectRepository;
    private final ProjectMapper projectMapper;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        log.debug("Getting all projects");
        var projectList = projectRepository.findAll().stream()
                .map(projectMapper::toResponse)
                .toList();
        log.debug("Project list: {}", projectList);
        return projectList;
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        log.debug("Getting project by id: {}", id);
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + id));
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        log.debug("Creating project with name: {}", request.getName());
        ProjectEntity project = projectMapper.toEntity(request);
        ProjectEntity savedProject = projectRepository.save(project);
        return projectMapper.toResponse(savedProject);
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        log.debug("Updating project with id: {}", id);
        ProjectEntity project = projectRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Project not found with id: " + id));
        
        projectMapper.updateFromRequest(request, project);
        ProjectEntity updatedProject = projectRepository.save(project);
        return projectMapper.toResponse(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        log.debug("Deleting project with id: {}", id);
        if (!projectRepository.existsById(id)) {
            throw new NoSuchElementException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsWithWeeklyTasks() {
        log.debug("Getting all projects with weekly tasks");
        return projectRepository.findAllWithWeeklyTasks().stream()
                .map(projectMapper::toResponseWithWeekly)
                .toList();
    }
}