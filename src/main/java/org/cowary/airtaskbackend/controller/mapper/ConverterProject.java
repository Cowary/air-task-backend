package org.cowary.airtaskbackend.controller.mapper;

import lombok.experimental.UtilityClass;
import org.cowary.airtaskbackend.controller.dto.BoardRs;
import org.cowary.airtaskbackend.controller.dto.ProjectDtoRs;
import org.cowary.airtaskbackend.controller.dto.ProjectListDtoRs;
import org.cowary.airtaskbackend.model.planko.GetProjects200Response;

@UtilityClass
public class ConverterProject {

    public static ProjectListDtoRs convert(GetProjects200Response source) {
        var list = source.getItems().stream()
                .map(project -> ProjectDtoRs.builder()
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
