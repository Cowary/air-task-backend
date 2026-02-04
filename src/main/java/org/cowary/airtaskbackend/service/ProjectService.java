package org.cowary.airtaskbackend.service;

import lombok.RequiredArgsConstructor;
import org.cowary.airtaskbackend.api.planko.ProjectsApi;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.ProjectListDtoRs;
import org.cowary.airtaskbackend.rest.planka.controller.mapper.ConverterProject;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectsApi projectsApi;

    public ProjectListDtoRs getAllProjects() {
        var rs = projectsApi.getProjects();
        return ConverterProject.convert(rs);
    }
}
