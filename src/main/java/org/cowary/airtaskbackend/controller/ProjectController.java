package org.cowary.airtaskbackend.controller;

import lombok.RequiredArgsConstructor;
import org.cowary.airtaskbackend.api.planko.ProjectsApi;
import org.cowary.airtaskbackend.controller.dto.ApiResponse;
import org.cowary.airtaskbackend.controller.dto.ProjectListDtoRs;
import org.cowary.airtaskbackend.controller.mapper.ConverterProject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/project")
@RequiredArgsConstructor
public class ProjectController {
    private final ProjectsApi projectsApi;

    @GetMapping("/v1/list")
    public ApiResponse<ProjectListDtoRs> getProjects() {
        var rs = projectsApi.getProjects();
        return ApiResponse.<ProjectListDtoRs>builder()
                .isSuccess(true)
                .data(ConverterProject.convert(rs))
                .build();
    }
}
