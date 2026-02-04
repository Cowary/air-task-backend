package org.cowary.airtaskbackend.rest.planka.controller.mapper;

import lombok.experimental.UtilityClass;
import org.cowary.airtaskbackend.model.planko.GetProjects200Response;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.BoardRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.PlankaProjectDtoRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.ProjectListDtoRs;

@UtilityClass
public class ConverterProject {

    public static ProjectListDtoRs convert(GetProjects200Response source) {
        var list = source.getItems().stream()
                .map(project -> PlankaProjectDtoRs.builder()
                        .id(Long.valueOf(project.getId()))
                        .name(project.getName())
                        .boardList(source.getIncluded().getBoards()
                                .stream()
                                .filter(b -> b.getProjectId().equals(project.getId()))
                                .map(b -> BoardRs.builder()
                                        .id(Long.valueOf(b.getId()))
                                        .name(b.getName())
                                        .projectId(Long.valueOf(b.getProjectId())).build())
                                .toList()).build()).toList();
        return ProjectListDtoRs.builder()
                .projectList(list)
                .build();
    }

}
