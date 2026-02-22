package org.cowary.airtaskbackend.rest.planka.controller;

import lombok.RequiredArgsConstructor;
import org.cowary.airtaskbackend.api.planko.ProjectsApi;
import org.cowary.airtaskbackend.rest.common.ApiResponse;
import org.cowary.airtaskbackend.rest.planka.dto.ProjectListDtoRs;
import org.cowary.airtaskbackend.rest.planka.mapper.ConverterProject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("/planka/project")
@RequiredArgsConstructor
public class PlankaProjectController {
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
