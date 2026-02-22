//package org.cowary.airtaskbackend.controller.mapper;
//
//import org.cowary.airtaskbackend.controller.dto.planka.BoardRs;
//import org.cowary.airtaskbackend.controller.dto.ProjectDtoRs;
//import org.cowary.airtaskbackend.model.planko.GetProjects200Response;
//import org.cowary.airtaskbackend.model.planko.GetProjects200ResponseItemsInner;
//import org.mapstruct.AfterMapping;
//import org.mapstruct.Mapper;
//import org.mapstruct.MappingTarget;
//
//import java.util.List;
//
//@Mapper(componentModel = "spring")
//public interface PlankaProjectToProjectDto {
//    ProjectDtoRs toDto(GetProjects200Response source);
//    List<ProjectDtoRs> toDtoList(List<GetProjects200Response> source);
//
//    @AfterMapping
//    default void afterMapping(@MappingTarget ProjectDtoRs target, GetProjects200ResponseItemsInner source) {
//        target.setBoardList(source..getBoards()
//                .stream()
//                .map(board -> BoardRs.builder()
//                        .id(Long.valueOf(board.getId()))
//                        .name(board.getName())
//                        .projectId(Long.valueOf(board.getProjectId()))
//                        .build())
//                .toList());
//    }
//}
