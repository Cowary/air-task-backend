package org.cowary.airtaskbackend.rest.project.controller.mapper;

import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.cowary.airtaskbackend.rest.project.controller.dto.WeeklyCreateRequest;
import org.cowary.airtaskbackend.rest.project.controller.dto.WeeklyResponse;
import org.cowary.airtaskbackend.rest.project.controller.dto.WeeklyUpdateRequest;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface WeeklyMapper {

    @Mapping(target = "project", ignore = true)
    WeeklyEntity toEntity(WeeklyCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateFromRequest(WeeklyUpdateRequest request, @MappingTarget WeeklyEntity entity);

    WeeklyResponse toResponse(WeeklyEntity entity);

    @Mapping(target = "projectId", source = "project.id")
    WeeklyResponse toResponseWithProject(WeeklyEntity entity);
}